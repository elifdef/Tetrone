import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { useDateFormatter } from "../hooks/useDateFormatter";
import { NotificationContext } from "../context/NotificationContext";
import { usePageTitle } from '../hooks/usePageTitle';
import { useNotificationText } from '../hooks/useNotificationText';
import ReportResultModal from '../components/common/ReportResultModal';
import ShieldIcon from '../assets/shield.svg?react';

const ListAvatar = ({ src, isSystem }) => {
    if (isSystem) {
        return (
            <div className="tetrone-notification-avatar system-avatar">
                <ShieldIcon width={64} height={64} />
            </div>
        );
    }
    return <img src={src} className="tetrone-notification-avatar" alt="avatar" />;
};

const NotificationListItem = ({ notif, handleNotificationClick, getNotificationData, formatDate }) => {
    const { t } = useTranslation();
    const isUnread = !notif.read_at;
    const data = notif.data || {};
    const { actionText, linkText, linkUrl } = getNotificationData(notif.type, data);

    const isSystem = notif.type?.includes('ReportReviewed') || data.type === 'report_reviewed';
    const actualUser = data.user || data;
    const senderName = isSystem ? t('common.moderator') : `${actualUser.user_first_name || actualUser.first_name} ${actualUser.user_last_name || actualUser.last_name || ''}`.trim();
    const snippetText = data.admin_response || data.post_snippet;
    const avatarUrl = actualUser.user_avatar || actualUser.avatar;
    const usernameUrl = actualUser.user_username || actualUser.username;
    const nameColor = actualUser.personalization?.username_color;

    const onBlockClick = (e) => {
        handleNotificationClick(notif, data, isSystem);
        if (!isSystem && linkUrl && e.target.tagName !== 'A') {
            Navigate(linkUrl);
        }
    };

    return (
        <div
            className={`tetrone-notification-item ${isUnread ? 'unread' : ''}`}
            onClick={onBlockClick}
            style={{ cursor: 'pointer' }}
        >
            {isSystem ? (
                <div className="tetrone-system-avatar-wrapper">
                    <ListAvatar isSystem={true} />
                </div>
            ) : (
                <Link to={`/${usernameUrl}`}>
                    <ListAvatar src={avatarUrl} isSystem={false} />
                </Link>
            )}

            <div className="tetrone-notification-content">
                <div className="tetrone-notification-text-row">
                    {isSystem ? (
                        <span className="tetrone-comment-author" style={nameColor ? { color: nameColor } : undefined} >
                            {senderName}
                        </span>
                    ) : (
                        <Link to={`/${usernameUrl}`} className="tetrone-comment-author" style={nameColor ? { color: nameColor } : undefined} >
                            {senderName}
                        </Link>
                    )}
                    {' '}
                    <span className="tetrone-notification-action">
                        {actionText}
                        {actionText && linkText ? ' ' : ''}
                        {linkUrl && linkText ? (
                            <Link to={linkUrl} className="tetrone-link">
                                {linkText}
                            </Link>
                        ) : (
                            linkText
                        )}
                    </span>
                </div>

                {snippetText && (
                    <div className="tetrone-notification-snippet">
                        "{snippetText}"
                    </div>
                )}

                <div className="tetrone-notification-date">
                    {formatDate(notif.created_at)}
                </div>
            </div>

            {isUnread && (
                <div className="tetrone-notification-dot" title={t('notifications.mark_read')}></div>
            )}
        </div>
    );
};

export default function NotificationsPage() {
    const { t } = useTranslation();
    const { notifications, markAsRead, unreadCount } = useContext(NotificationContext);
    const formatDate = useDateFormatter();
    const { getNotificationData } = useNotificationText();

    usePageTitle(t('notifications.my_notifications'));

    const [selectedReport, setSelectedReport] = useState(null);

    const handleNotificationClick = (notif, payload, isSystemReport) => {
        if (!notif.read_at) markAsRead(notif.id);
        if (isSystemReport) setSelectedReport(payload);
    };

    return (
        <div className="tetrone-card-wrapper">
            <h1 className="tetrone-section-title tetrone-wall-header">
                <span>{t('notifications.my_notifications')}</span>
                {unreadCount > 0 && <span className="tetrone-wall-count">+{unreadCount}</span>}
            </h1>

            {notifications.length === 0 ? (
                <div className="tetrone-empty-state">
                    <p>{t('empty.notifications')}</p>
                </div>
            ) : (
                <div className="tetrone-notification-list">
                    {notifications.map((notif) => (
                        <NotificationListItem
                            key={notif.id}
                            notif={notif}
                            handleNotificationClick={handleNotificationClick}
                            getNotificationData={getNotificationData}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            )}

            <ReportResultModal
                payload={selectedReport}
                onClose={() => setSelectedReport(null)}
            />
        </div>
    );
}