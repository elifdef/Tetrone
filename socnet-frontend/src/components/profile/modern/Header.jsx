import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useInbox } from "../../../hooks/useInbox";
import { useDateFormatter } from "../../../hooks/useDateFormatter";

import editIcon from "../../../assets/edit.svg";
import msgIcon from "../../../assets/comment.svg";
import flagIcon from "../../../assets/flag.svg";

export default function Header({
    currentUser, isPreview, displayAvatar, isBlockedByTarget, isBanned,
    authUser, sameUser, loading, status, isBlockedByMe,
    handleFriendshipAction, handleBlockAction, onReportAction,
    customNameColor
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { initChat } = useInbox();
    const formatDate = useDateFormatter();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
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

    const getStatusText = () => {
        if (currentUser.is_online) return t('profile.online');
        if (!currentUser.last_seen) return t('profile.offline', { time: '' });

        const dateStr = formatDate(currentUser.last_seen);
        if (currentUser.gender === 1) return t('profile.status.last_seen_m', { time: dateStr });
        if (currentUser.gender === 2) return t('profile.status.last_seen_f', { time: dateStr });

        return t('profile.status.last_seen_n', { time: dateStr });
    };

    const getStatusBlock = () => {
        if (isPreview) return null;
        return (
            <span className={`socnet-modern-status ${currentUser.is_online ? 'online' : 'offline'}`}>
                {currentUser.is_online && <span className="socnet-modern-online-dot"></span>}
                {getStatusText()}
            </span>
        );
    };

    const getActionBtnLabel = () => {
        if (loading) return "...";
        if (isBlockedByMe) return t('profile.menu.you_have_blocked');
        switch (status) {
            case 'friends': return `${t('common.your_friends')} ✓`;
            case 'pending_sent': return t('friends.request_sent');
            case 'pending_received': return t('profile.menu.request_received');
            default: return t('profile.menu.add_friends');
        }
    };

    const getFriendMenuLabel = () => {
        switch (status) {
            case 'friends': return t('friends.remove_friends');
            case 'pending_sent': return t('profile.menu.cancel_request');
            case 'pending_received': return t('friends.accept_request');
            default: return t('profile.menu.add_friends');
        }
    };

    const handleSendMessage = async () => {
        setIsChatLoading(true);
        try {
            const slug = await initChat(currentUser.id);
            if (slug) navigate(`/messages?dm=${slug}`);
        } finally {
            setIsChatLoading(false);
        }
    };

    const nameStyle = { color: customNameColor };

    return (
        <div className="socnet-modern-header">
            <div className="socnet-modern-header-main">
                <div className="socnet-modern-avatar-wrapper">
                    <img
                        src={displayAvatar}
                        alt="avatar"
                        className={`socnet-modern-avatar ${(!isPreview && (isBlockedByTarget || isBanned)) ? 'socnet-avatar-blocked' : ''}`}
                    />
                </div>

                <div className="socnet-modern-name-row">
                    <h1 className="socnet-modern-name" style={nameStyle}>
                        {currentUser.first_name} {currentUser.last_name}
                    </h1>
                    <div className="socnet-modern-nick-row">
                        <span className="socnet-modern-nick" style={nameStyle}>@{currentUser.username}</span>
                        {getStatusBlock()}
                    </div>
                </div>
            </div>

            <div className="socnet-modern-actions-group">
                {sameUser && !isPreview && (
                    <Link to="/settings" className="socnet-btn-ghost modern-action-btn">
                        <img src={editIcon} alt="edit" width="14" height="14" />
                        {t('common.edit')}
                    </Link>
                )}

                {!sameUser && !isPreview && !isBlockedByTarget && authUser && (
                    <>
                        {!isBlockedByMe && (
                            <button
                                className="socnet-btn modern-action-btn"
                                onClick={handleSendMessage}
                                disabled={isChatLoading || loading}
                            >
                                <img src={msgIcon} alt="msg" width="14" height="14" />
                                {isChatLoading ? '...' : t('messages.send_message')}
                            </button>
                        )}

                        <div className="socnet-dropdown-wrapper" ref={menuRef}>
                            <button
                                className="socnet-btn socnet-btn-dropdown-trigger modern-trigger"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                disabled={loading}
                            >
                                {getActionBtnLabel()}
                            </button>

                            {isMenuOpen && (
                                <div className="socnet-menu-list modern-menu-list">
                                    {!isBlockedByMe && (
                                        <button className="socnet-menu-item" onClick={() => { handleFriendshipAction(); setIsMenuOpen(false); }}>
                                            {getFriendMenuLabel()}
                                        </button>
                                    )}

                                    <button className="socnet-menu-item modern-menu-item" onClick={() => { onReportAction(); setIsMenuOpen(false); }}>
                                        <img src={flagIcon} alt="report" width="12" height="12" />
                                        {t('reports.title')}
                                    </button>

                                    <button
                                        className={`socnet-menu-item ${!isBlockedByMe ? 'danger' : ''}`}
                                        onClick={() => { handleBlockAction(); setIsMenuOpen(false); }}
                                    >
                                        {isBlockedByMe ? t('common.to_unblock') : t('common.to_block')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}