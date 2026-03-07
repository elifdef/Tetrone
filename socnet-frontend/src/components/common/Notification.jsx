import { useEffect } from 'react';
import { useNotificationText } from '../../hooks/useNotificationText';
import { useTranslation } from 'react-i18next';

const NotificationAvatar = ({ src, isSystem }) => {
    if (isSystem) {
        return (
            <div
                className="socnet-toast-avatar"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--theme-bg-page, #f0f2f5)',
                    border: '1px solid var(--theme-border)'
                }}
            >
                <svg viewBox='0 0 24 24' fill='var(--theme-link, #6383a8)' width="20" height="20">
                    <path d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z' />
                </svg>
            </div>
        );
    }

    return (
        <img
            src={src || '/default-system-avatar.png'}
            alt="avatar"
            className="socnet-toast-avatar"
            style={{ objectFit: 'cover' }}
        />
    );
};

const NotificationContent = ({ name, text, snippet }) => (
    <div className="socnet-toast-content">
        <span className="socnet-toast-name">
            {name}
        </span>
        <span className="socnet-toast-text">
            {text}
        </span>
        {snippet && (
            <span className="socnet-toast-snippet">
                "{snippet}"
            </span>
        )}
    </div>
);

export default function Notification({ notification, onClose }) {
    const { getNotificationData } = useNotificationText();
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => onClose(), 7000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const payload = notification.data || notification;

    const { actionText, linkText } = getNotificationData(notification.type, notification);
    const fullText = `${actionText} ${linkText || ''}`.trim();

    const isSystem = notification.type?.includes('ReportReviewed') || payload.type === 'report_reviewed';

    const senderName = isSystem
        ? t('common.moderation')
        : `${notification.user_first_name || ''} ${notification.user_last_name || ''}`.trim();

    const snippetText = payload.admin_response || payload.post_snippet;

    return (
        <div className="socnet-toast">
            <NotificationAvatar
                src={notification.user_avatar}
                isSystem={isSystem}
            />

            <NotificationContent
                name={senderName}
                text={fullText}
                snippet={snippetText}
            />
        </div>
    );
}