import { Link } from "react-router-dom";

export default function FriendCard({ user, viewMode, onAction }) {
    const renderButtons = () => {
        const btnClass = "vk-friends-btn";

        if (viewMode === 'my') {
            return (
                <>
                    <button
                        className={`${btnClass} vk-friends-btn-danger`}
                        onClick={() => onAction('delete', user.username)}
                    >
                        Видалити
                    </button>
                    <button
                        className={`${btnClass} vk-friends-btn-secondary`}
                        onClick={() => onAction('block', user.username)}
                    >
                        Блок
                    </button>
                </>
            );
        }

        if (viewMode === 'requests') {
            return (
                <>
                    <button
                        className={`${btnClass} vk-friends-btn-primary`}
                        onClick={() => onAction('accept', user.username)}
                    >
                        Прийняти
                    </button>
                    <button
                        className={`${btnClass} vk-friends-btn-secondary`}
                        onClick={() => onAction('cancel_request', user.username)}
                    >
                        Відхилити
                    </button>
                </>
            );
        }

        if (viewMode === 'subscriptions') {
            return (
                <button
                    className={`${btnClass} vk-friends-btn-secondary`}
                    onClick={() => onAction('cancel_request', user.username)}
                >
                    Скасувати
                </button>
            );
        }

        if (viewMode === 'blocked') {
            return (
                <button
                    className={`${btnClass} vk-friends-btn-primary`}
                    onClick={() => onAction('unblock', user.username)}
                >
                    Розблокувати
                </button>
            );
        }

        switch (user.friendship_status) {
            case 'friends':
                return (
                    <span className="vk-friends-status">Ваш друг</span>
                );

            case 'pending_sent':
                return (
                    <button
                        className={`${btnClass} vk-friends-btn-secondary`}
                        onClick={() => onAction('cancel_request', user.username)}
                    >
                        Скасувати
                    </button>
                );

            case 'pending_received':
                return (
                    <button
                        className={`${btnClass} vk-friends-btn-primary`}
                        onClick={() => onAction('accept', user.username)}
                    >
                        Прийняти
                    </button>
                );

            case 'blocked_by_me':
                return (
                    <button
                        className={`${btnClass} vk-friends-btn-primary`}
                        onClick={() => onAction('unblock', user.username)}
                    >
                        Розблокувати
                    </button>
                );

            case 'blocked_by_target':
                return (
                    <span
                        className="vk-friends-status"
                    >
                        Заблоковано
                    </span>
                );

            default:
                return (
                    <button
                        className={`${btnClass} vk-friends-btn-primary`}
                        onClick={() => onAction('add', user.username)}
                    >
                        Додати
                    </button>
                );
        }
    };

    return (
        <div className="friend-card">
            <Link to={`/${user.username}`} className="vk-friends-avatar-link">
                <img src={user.avatar || "/defaultAvatar.jpg"} alt={user.username} className="vk-friends-avatar" />
            </Link>

            <div className="vk-friends-info">
                <Link to={`/${user.username}`} className="vk-friends-name">
                    {user.first_name} {user.last_name}
                </Link>
                <div className="vk-friends-username">@{user.username}</div>
            </div>

            <div className="vk-friends-actions">
                {renderButtons()}
            </div>
        </div>
    );
}