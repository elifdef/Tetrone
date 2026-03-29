import { createContext, useState, useEffect } from "react";
import fetchClient from "../api/client";
import { getSystemLanguage } from "../i18n";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notifyError } from "../components/common/Notify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        if (!user) setLoading(true);
        setInitError(false);

        const controller = new AbortController();

        fetchClient('/me', { signal: controller.signal })
            .then(res => {
                if (controller.signal.aborted) return;

                if (res.success) {
                    setUser(res.data);
                } else {
                    if (res.status === 401) {
                        logoutLocally();
                    } else {
                        setInitError(true);
                    }
                }
            })
            .catch(err => {
                if (controller.signal.aborted) return;

                if (err.status === 401) {
                    logoutLocally();
                } else {
                    setInitError(true);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [token]);

    const logoutLocally = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        const handleSessionExpired = () => {
            logoutLocally();
            notifyError(t('api.error.ERR_UNAUTHORIZED'));
            navigate('/login');
        };

        window.addEventListener('session-expired', handleSessionExpired);
        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, [navigate, t]);

    useEffect(() => {
        if (!user) return;

        let isOfflineSent = false;

        const pingServer = () => {
            if (document.visibilityState === 'visible') {
                isOfflineSent = false;
                fetchClient('/user/ping', { method: 'POST', body: { active: true } });
            }
        };

        const sendOfflineStatus = () => {
            if (isOfflineSent) return;
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

    useEffect(() => {
        if (!user) return;
        const channel = new BroadcastChannel('auth_channel');
        channel.onmessage = (event) => {
            if (event.data.type === 'EMAIL_VERIFIED') {
                setUser(prev => ({ ...prev, email_verified_at: event.data.date }));
            }
        };
        return () => channel.close();
    }, [user]);

    const login = (newToken, newUser) => {
        localStorage.setItem('token', newToken);
        if (!localStorage.getItem('lang')) {
            localStorage.setItem('lang', getSystemLanguage());
        }
        localStorage.setItem('dark_theme', 'true');
        setUser(newUser);
        setToken(newToken);
        setInitError(false);
    };

    const logout = async () => {
        await fetchClient('/sign-out', { method: 'POST' }).catch(() => { });
        logoutLocally();
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, login, logout, loading, initError, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};