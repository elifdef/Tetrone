import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useDateFormatter } from "../hooks/useDateFormatter";
import { NotificationContext } from "../context/NotificationContext";
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotificationsPage() {
    const { t } = useTranslation();
    const { notifications, markAsRead, unreadCount } = useContext(NotificationContext);
    const formatDate = useDateFormatter();
    usePageTitle(t('notifications.my_notifications'));

    const renderText = (typeKey, data) => {
        const gender = data.user_gender === 2 ? 'female' : 'male';
        let key = typeKey;

        if (key.includes('NewLike')) key = 'new_like';
        if (key.includes('NewComment')) key = 'new_comment';
        if (key.includes('NewFriendRequest')) key = 'new_friend_request';

        const postLink = (text) => (
            <Link
                to={`/post/${data.post_id}`}
                className="socnet-link"
                onClick={(e) => e.stopPropagation()}
            >
                {text}
            </Link>
        );

        switch (key) {
            case 'new_like':
                return (
                    <>
                        {t('notifications.liked', { context: gender })} {postLink(t('notifications.your_post'))}
                    </>
                );
            case 'new_comment':
                return (
                    <>
                        {t('notifications.commented', { context: gender })} {postLink(t('notifications.your_post'))}
                    </>
                );
            case 'new_friend_request':
                return t('notifications.friend_request', { context: gender });
            default:
                return '';
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.read_at)
            markAsRead(notif.id);
    };

    return (
        <div className="socnet-card-wrapper">
            <h1 className="socnet-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('notifications.my_notifications')}</span>
                {unreadCount > 0 && <span>+{unreadCount}</span>}
            </h1>

            {notifications.length === 0 ? (
                <div className="socnet-empty-state">
                    <p>{t('notifications.empty')}</p>
                </div>
            ) : (
                <div className="socnet-notification-list">
                    {notifications.map((notif) => {
                        const isUnread = !notif.read_at;
                        const data = notif.data || {};

                        return (
                            <div
                                key={notif.id}
                                className={`socnet-notification-item ${isUnread ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                <Link to={`/${data.user_username}`} onClick={(e) => e.stopPropagation()}>
                                    <img src={data.user_avatar} className="socnet-notification-avatar" alt={data.user_username} />
                                </Link>

                                <div className="socnet-notification-content">
                                    <div>
                                        <Link
                                            to={`/${data.user_username}`}
                                            className="socnet-link"
                                            style={{ fontWeight: 'bold' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {data.user_first_name} {data.user_last_name}
                                        </Link>
                                        {' '}
                                        <span>
                                            {renderText(notif.type, data)}
                                        </span>
                                    </div>

                                    {data.post_snippet && (
                                        <div className="socnet-notification-snippet">
                                            "{data.post_snippet}"
                                        </div>
                                    )}

                                    <div className="socnet-notification-date">
                                        {formatDate(notif.created_at)}
                                    </div>
                                </div>

                                {isUnread && (
                                    <div className="socnet-notification-dot" title={t('notifications.mark_read')}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}