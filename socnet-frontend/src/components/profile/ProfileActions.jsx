import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

export default function ProfileActions({
    sameUser, loading, status, isBlockedByMe, isBlockedByTarget,
    onFriendAction, onBlockAction
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (sameUser)
        return (
            <div className="vk-actions">
                <Link to="/settings" className="vk-btn">Редагувати</Link>
            </div>
        );

    if (isBlockedByTarget)
        return null;

    const getStatusLabel = () => {
        if (loading) return "...";
        if (isBlockedByMe) return "Ви заблокували";
        switch (status) {
            case 'friends': return "У вас в друзях ✓";
            case 'pending_sent': return "Заявка надіслана";
            case 'pending_received': return "Заявка отримана";
            default: return "Не у вас у друзях";
        }
    };

    const getFriendActionLabel = () => {
        switch (status) {
            case 'friends': return "Видалити з друзів";
            case 'pending_sent': return "Скасувати заявку";
            case 'pending_received': return "Прийняти заявку";
            default: return "Додати у друзі";
        }
    };

    return (
        <div className="vk-actions">
            <div className="vk-dropdown-wrapper" ref={menuRef}>
                <button
                    className="vk-btn vk-btn-dropdown-trigger"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    disabled={loading}
                >
                    {getStatusLabel()}
                </button>

                {isMenuOpen && (
                    <div className="vk-menu-list">
                        {!isBlockedByMe && (
                            <button className="vk-menu-item" onClick={() => { onFriendAction(); setIsMenuOpen(false); }}>
                                {getFriendActionLabel()}
                            </button>
                        )}
                        <button
                            className={`vk-menu-item ${!isBlockedByMe ? 'danger' : ''}`}
                            onClick={() => { onBlockAction(); setIsMenuOpen(false); }}
                        >
                            {isBlockedByMe ? "Розблокувати" : "Заблокувати"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}