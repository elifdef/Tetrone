import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Notification({ notification, onClose }) {
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => onClose(), 7000); // 7 секунд
        return () => clearTimeout(timer);
    }, [onClose]);

    const renderActionText = () => {
        const gender = notification.user_gender === 2 ? 'female' : 'male';
        let typeKey = notification.type;

        if (typeKey.includes('NewLike')) typeKey = 'new_like';
        if (typeKey.includes('NewComment')) typeKey = 'new_comment';
        if (typeKey.includes('NewFriendRequest')) typeKey = 'new_friend_request';

        switch (typeKey) {
            case 'new_like':
                return `${t('notifications.liked', { context: gender })} ${t('notifications.your_post')}`;

            case 'new_comment':
                return `${t('notifications.commented', { context: gender })} ${t('notifications.your_post')}`;

            case 'new_friend_request':
                return t('notifications.friend_request', { context: gender });

            default:
                return '';
        }
    };

    return (
        <div className="socnet-toast">
            <img
                src={notification.user_avatar}
                alt="avatar"
                className="socnet-toast-avatar"
            />
            <div className="socnet-toast-content">
                <span className="socnet-toast-name">
                    {notification.user_first_name} {notification.user_last_name}
                </span>
                <span className="socnet-toast-text">
                    {renderActionText()}
                </span>

                {notification.post_snippet && (
                    <span className="socnet-toast-snippet">
                        "{notification.post_snippet}"
                    </span>
                )}
            </div>
        </div>
    );
}