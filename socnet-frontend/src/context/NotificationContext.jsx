import { createContext, useState, useEffect, useContext } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { AuthContext } from './AuthContext';
import fetchClient from '../api/client';
import Notification from '../components/common/Notification';
import { audioManager } from '../utils/audioManager';

window.Pusher = Pusher;

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
            // Завантажуємо сповіщення
            fetchClient('/notifications')
                .then(data => {
                    setNotifications(data.notifications);
                    setUnreadCount(data.unread_count);
                })
                .catch(err => console.error("Error loading notifications: ", err.data?.message || err.message));

            // Завантажуємо чати для підрахунку непрочитаних
            fetchClient('/chat')
                .then(chats => {
                    const totalUnreadMsg = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
                    setUnreadMessagesCount(totalUnreadMsg);
                })
                .catch(err => console.error("Error loading chats for unread count: ", err));
        }
    }, [user]);

    useEffect(() => {
        if (!user || !token) return;

        try {
            const baseUrl = import.meta.env.VITE_API_URL.replace('/v1', '');

            const echo = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: import.meta.env.VITE_REVERB_HOST,
                wsPort: import.meta.env.VITE_REVERB_PORT,
                wssPort: import.meta.env.VITE_REVERB_PORT,
                forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: `${baseUrl}/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    }
                }
            });

            setEchoInstance(echo);

            // ПІДКЛЮЧАЄМО ПРИВАТНИЙ КАНАЛ СПОВІЩЕНЬ
            const channelName = `App.Models.User.${user.id}`;
            const channel = echo.private(channelName);

            channel.subscribed(() => {
                console.log(`Socket connected (Private).`);
            });

            channel.error((err) => {
                console.error(`Error connecting to Socket: `, err);
            });

            channel.notification((notification) => {
                const toastId = Date.now();
                const isNewMessage = notification.type === 'new_message' || notification.type?.includes('NewMessage');

                // Перевіряємо, чи дозволив юзер показувати тост/грати звук
                const shouldShowToast = notification.show_toast !== false;

                if (isNewMessage) {
                    setIncomingMessage(notification);
                    const currentParams = new URLSearchParams(window.location.search);

                    // Якщо ми прямо зараз у цьому чаті - звук і тост не показуємо, 
                    // просто оновлюємо повідомлення
                    if (currentParams.get('dm') === notification.chat_slug) {
                        return;
                    }

                    // збільшуємо лічильник повідомлень ЗАВЖДИ
                    setUnreadMessagesCount(prev => prev + 1);

                    if (shouldShowToast) {
                        if (notification.sound && notification.sound !== 'none') {
                            audioManager.playMessageSound(notification.sound);
                        }
                        setActiveToasts(prev => {
                            const newToasts = [...prev, { ...notification, toastId }];
                            return newToasts.slice(-3);
                        });
                    }
                    return;
                }

                const { id, type, ...customData } = notification;
                const normalizedNotif = {
                    id: id,
                    type: type,
                    read_at: null,
                    created_at: new Date().toISOString(),
                    data: customData
                };

                // додаємо в список і збільшуємо лічильник
                setNotifications(prev => [normalizedNotif, ...prev]);
                setUnreadCount(prev => prev + 1);

                // якщо дозволено - показуємо тост і звук
                if (shouldShowToast) {
                    if (notification.sound && notification.sound !== 'none') {
                        audioManager.playMessageSound(notification.sound);
                    }

                    setActiveToasts(prev => {
                        const newToasts = [...prev, { ...notification, toastId }];
                        return newToasts.slice(-3);
                    });
                }
            });

            channel.listen('.message_deleted', (event) => {
                setIncomingMessage({
                    type: 'message_deleted',
                    chat_slug: event.chat_slug,
                    message_id: event.message_id
                });
            });

            // ПІДКЛЮЧАЄМО PRESENCE КАНАЛ ДЛЯ ОНЛАЙН СТАТУСУ
            echo.join('online')
                .here((users) => {
                    // Хто вже був онлайн, коли ми зайшли
                    setOnlineUsers(users.map(u => u.id));
                })
                .joining((joiningUser) => {
                    // Хтось щойно підключився до сокетів
                    setOnlineUsers(prev => {
                        if (!prev.includes(joiningUser.id)) return [...prev, joiningUser.id];
                        return prev;
                    });
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

        } catch (error) {
            console.error("Error initializing Echo: ", error);
        }

    }, [user, token]);

    const markAsRead = (id) => {
        fetchClient(`/notifications/${id}/read`, { method: 'POST' })
            .then(() => {
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
                );
            })
            .catch(err => console.error("Error marking notification as read: ", err.data?.message || err.message));
    };

    const removeToast = (toastId) => {
        setActiveToasts(prev => prev.filter(t => t.toastId !== toastId));
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            unreadMessagesCount,
            setUnreadMessagesCount,
            incomingMessage,
            echoInstance,
            onlineUsers
        }}>
            {children}
            <div className="socnet-toast-container">
                {activeToasts.map(toast => (
                    <Notification key={toast.toastId} notification={toast} onClose={() => removeToast(toast.toastId)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};