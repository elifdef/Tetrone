import { createContext, useState, useEffect } from "react";
import fetchClient from "../api/client";
import { getSystemLanguage } from "../i18n";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();

    // перед загрузкою перевіряєм чи правильний токен і чи не лежить бекенд
    useEffect(() => {
        if (token) {
            setLoading(true);
            setInitError(false);

            const controller = new AbortController();

            fetchClient('/me', { signal: controller.signal }).then(res => {
                if (controller.signal.aborted) return; // Ігноруємо, якщо запит скасовано

                if (res.success) {
                    setUser(res.data);
                } else {
                    if (res.status === 401) {
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    } else {
                        setInitError(true);
                    }
                }
                setLoading(false);
            });

            return () => controller.abort();
        } else {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        const handleSessionExpired = () => {
            localStorage.removeItem('token');
            setUser(null);
            notifyError(t('api.error.ERR_UNAUTHORIZED'));

            navigate('/login');
        };

        window.addEventListener('session-expired', handleSessionExpired);

        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, [navigate, t]);

    // трекер онлайну
    useEffect(() => {
        if (!user) return;

        let isOfflineSent = false; // захист від подвійного відправлення

        const pingServer = () => {
            if (document.visibilityState === 'visible') {
                isOfflineSent = false; // Скидаємо прапорець, коли юзер повернувся
                fetchClient('/user/ping', { method: 'POST', body: { active: true } });
            }
        };

        const sendOfflineStatus = () => {
            if (isOfflineSent) return; // Якщо вже відправили - ігноруємо
            isOfflineSent = true;

            fetchClient('/user/offline', { method: 'POST', keepalive: true });
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

    const logout = async () => {
        await fetchClient('/sign-out', { method: 'POST' });
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, login, logout, loading, initError, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};