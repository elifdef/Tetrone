import { createContext, useState, useEffect } from "react";
import fetchClient from "../api/client";
import { getSystemLanguage } from "../i18n";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(false);

    // перед загрузкою перевіряєм чи правильний токен і чи не лежить бекенд
    useEffect(() => {
        if (token) {
            setLoading(true);
            setInitError(false);

            const controller = new AbortController();

            fetchClient('/me', { signal: controller.signal })
                .then(data => {
                    setUser(data);
                    setLoading(false);
                })
                .catch((err) => {
                    if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.name === 'AbortError')
                        return;

                    if (err.status === 401) {
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                        setLoading(false);
                    } else {
                        setInitError(true);
                        setLoading(false);
                    }
                });
            return () => controller.abort();
        } else {
            setLoading(false);
        }
    }, [token]);

    // трекер онлайну
    useEffect(() => {
        if (!user) return;

        let isOfflineSent = false; // захист від подвійного відправлення

        const pingServer = () => {
            if (document.visibilityState === 'visible') {
                isOfflineSent = false; // Скидаємо прапорець, коли юзер повернувся
                fetchClient('/user/ping', { method: 'POST', body: { active: true } })
                    .catch(() => { });
            }
        };

        const sendOfflineStatus = () => {
            if (isOfflineSent) return; // Якщо вже відправили - ігноруємо
            isOfflineSent = true;

            fetchClient('/user/offline', { method: 'POST', keepalive: true })
                .catch(() => { });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                sendOfflineStatus();
            } else if (document.visibilityState === 'visible') {
                pingServer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', sendOfflineStatus);

        pingServer();
        const interval = setInterval(pingServer, 60000);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', sendOfflineStatus);
        };
    }, [user]);

    // для моментальної зміни статусу підтвердження пошти
    useEffect(() => {
        if (!user) return;
        const channel = new BroadcastChannel('auth_channel');
        channel.onmessage = (event) => {
            if (event.data.type === 'EMAIL_VERIFIED' && user)
                setUser((prevUser) => ({
                    ...prevUser,
                    email_verified_at: event.data.date
                }));
        };
        return () => channel.close();
    }, [user]);

    const login = (newToken, newUser) => {
        localStorage.setItem('token', newToken);
        if (!localStorage.getItem('lang')) {
            localStorage.setItem('lang', getSystemLanguage());
        }
        localStorage.setItem('dark_theme', true);
        setToken(newToken);
        setUser(newUser);
        setInitError(false);
    };

    const logout = () => {
        fetchClient('/sign-out', { method: 'POST' }).finally(() => {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        });
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, login, logout, loading, initError, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};