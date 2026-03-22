import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import fetchClient from '../api/client';
import Notification from '../components/common/Notification';
import { audioManager } from '../utils/audioManager';
import { createEchoInstance } from '../utils/echoSetup';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, token } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [activeToasts, setActiveToasts] = useState([]);
    const [incomingMessage, setIncomingMessage] = useState(null);

    const [echoInstance, setEchoInstance] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (user) {
            fetchClient('/notifications').then(res => {
                if (res.success) {
                    setNotifications(res.data?.notifications || []);
                    setUnreadCount(res.data?.unread_count || 0);
                }
            });

            fetchClient('/chat').then(res => {
                if (res.success) {
                    const chats = res.data || [];
                    const totalUnreadMsg = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
                    setUnreadMessagesCount(totalUnreadMsg);
                }
            });
        }
    }, [user]);

    useEffect(() => {
        if (!user || !token) return;

        const echo = createEchoInstance(token);
        if (!echo) return;

        setEchoInstance(echo);

        const channelName = `App.Models.User.${user.id}`;
        const channel = echo.private(channelName);

        channel.subscribed(() => console.log(`Socket connected (Private).`));
        channel.error((err) => console.error(`Error connecting to Socket: `, err));

        channel.notification((notification) => {
            const toastId = Date.now();
            const isNewMessage = notification.type === 'new_message' || notification.type?.includes('NewMessage');
            const shouldShowToast = notification.show_toast !== false;

            if (isNewMessage) {
                setIncomingMessage(notification);
                const currentParams = new URLSearchParams(window.location.search);

                if (currentParams.get('dm') === notification.chat_slug) return;

                setUnreadMessagesCount(prev => prev + 1);

                if (shouldShowToast) {
                    if (notification.sound && notification.sound !== 'none') {
                        audioManager.playMessageSound(notification.sound);
                    }
                    setActiveToasts(prev => [...prev, { ...notification, toastId }].slice(-3));
                }
                return;
            }

            const { id, type, ...customData } = notification;
            const normalizedNotif = {
                id, type, read_at: null, created_at: new Date().toISOString(), data: customData
            };

            setNotifications(prev => [normalizedNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            if (shouldShowToast) {
                if (notification.sound && notification.sound !== 'none') {
                    audioManager.playMessageSound(notification.sound);
                }
                setActiveToasts(prev => [...prev, { ...notification, toastId }].slice(-3));
            }
        });

        channel.listen('.message_deleted', (event) => {
            setIncomingMessage({
                type: 'message_deleted',
                chat_slug: event.chat_slug,
                message_id: event.message_id
            });
        });

        echo.join('online')
            .here((users) => setOnlineUsers(users.map(u => u.id)))
            .joining((joiningUser) => {
                setOnlineUsers(prev => !prev.includes(joiningUser.id) ? [...prev, joiningUser.id] : prev);
            })
            .leaving((leavingUser) => {
                setOnlineUsers(prev => prev.filter(id => id !== leavingUser.id));
            });

        return () => {
            echo.leaveChannel(channelName);
            echo.leave('online');
            echo.disconnect();
            setEchoInstance(null);
        };
    }, [user, token]);

    const markAsRead = async (id) => {
        const res = await fetchClient(`/notifications/${id}/read`, { method: 'POST' });
        if (res.success) {
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        }
    };

    const removeToast = (toastId) => setActiveToasts(prev => prev.filter(t => t.toastId !== toastId));

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, markAsRead, unreadMessagesCount, setUnreadMessagesCount,
            incomingMessage, echoInstance, onlineUsers
        }}>
            {children}
            <div className="tetrone-toast-container">
                {activeToasts.map(toast => (
                    <Notification key={toast.toastId} notification={toast} onClose={() => removeToast(toast.toastId)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};