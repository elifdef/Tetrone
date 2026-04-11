import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function FriendCard({ user, viewMode, onAction }) {
    const { t } = useTranslation();

    const renderButtons = () => {
        const btnClass = "tetrone-friends-btn";

        if (viewMode === 'my') {
            return (
                <>
                    <button
                        className={`${btnClass} tetrone-friends-btn-secondary`}
                        onClick={() => onAction('delete', user.username)}
                    >
                        {t('action.delete')}
                    </button>
                    <button
                        className={`${btnClass} tetrone-friends-btn-danger`}
                        onClick={() => onAction('block', user.username)}
                    >
                        {t('action.block')}
                    </button>
                </>
            );
        }

        if (viewMode === 'requests') {
            return (
                <>
                    <button
                        className={`${btnClass} tetrone-friends-btn-primary`}
                        onClick={() => onAction('accept', user.username)}
                    >
                        {t('action.accept')}
                    </button>
                    <button
                        className={`${btnClass} tetrone-friends-btn-secondary`}
                        onClick={() => onAction('cancel_request', user.username)}
                    >
                        {t('action.dismiss')}
                    </button>
                </>
            );
        }

        if (viewMode === 'subscriptions') {
            return (
                <button
                    className={`${btnClass} tetrone-friends-btn-secondary`}
                    onClick={() => onAction('cancel_request', user.username)}
                >
                    {t('action.cancel')}
                </button>
            );
        }

        if (viewMode === 'blocked') {
            return (
                <button
                    className={`${btnClass} tetrone-friends-btn-primary`}
                    onClick={() => onAction('unblock', user.username)}
                >
                    {t('action.unblock')}
                </button>
            );
        }

        switch (user.friendship_status) {
            case 'friends':
                return (
                    <span className="tetrone-friends-status">{t('friends.your_contacts')}</span>
                );

            case 'pending_sent':
                return (
                    <button
                        className={`${btnClass} tetrone-friends-btn-secondary`}
                        onClick={() => onAction('cancel_request', user.username)}
                    >
                        {t('action.cancel')}
                    </button>
                );

            case 'pending_received':
                return (
                    <button
                        className={`${btnClass} tetrone-friends-btn-primary`}
                        onClick={() => onAction('accept', user.username)}
                    >
                        {t('action.accept')}
                    </button>
                );

            case 'blocked_by_me':
                return (
                    <button
                        className={`${btnClass} tetrone-friends-btn-primary`}
                        onClick={() => onAction('unblock', user.username)}
                    >
                        {t('action.unblock')}
                    </button>
                );

            case 'blocked_by_target':
                return (
                    <span className="tetrone-friends-status">{t('common.blocked')}</span>
                );

            default:
                return (
                    <button
                        className={`${btnClass} tetrone-friends-btn-primary`}
                        onClick={() => onAction('add', user.username)}
                    >
                        {t('action.add')}
                    </button>
                );
        }
    };

    return (
        <div className="friend-card">
            <Link to={`/${user.username}`} className="tetrone-friends-avatar-link">
                <img src={user.avatar} alt={user.username} className="tetrone-friends-avatar" />
            </Link>

            <div className="tetrone-friends-info">
                <Link to={`/${user.username}`} className="tetrone-friends-name">
                    {user.first_name} {user.last_name}
                </Link>
                <div className="tetrone-friends-username">@{user.username}</div>
            </div>

            <div className="tetrone-friends-actions">
                {renderButtons()}
            </div>
        </div>
    );
}