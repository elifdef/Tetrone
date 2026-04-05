import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import MessageService from "../../../services/chat.service";
import Button from "../../ui/Button";

export default function ProfileActions({
    sameUser, userId, loading, status, isBlockedByMe, isBlockedByTarget,
    onFriendAction, onBlockAction, onReportAction, permissions
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

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

    if (sameUser)
        return (
            <div className="tetrone-actions">
                <Link to="/settings" className="tetrone-btn tetrone-btn-primary">{t('common.edit')}</Link>
            </div>
        );

    if (isBlockedByTarget) return null;

    const getStatusLabel = () => {
        if (loading) return "...";
        if (isBlockedByMe) return t('profile.menu.you_have_blocked');

        switch (status) {
            case 'friends': return `${t('common.your_friends')} ✓`;
            case 'pending_sent': return t('friends.request_sent');
            case 'pending_received': return t('profile.menu.request_received');
            default: return t('profile.menu.not_your_friends');
        }
    };

    const getFriendActionLabel = () => {
        switch (status) {
            case 'friends': return t('friends.remove_friends');
            case 'pending_sent': return t('profile.menu.cancel_request');
            case 'pending_received': return t('friends.accept_request');
            default: return t('profile.menu.add_friends');
        }
    };

    const handleSendMessage = async () => {
        setIsChatLoading(true);
        const res = await MessageService.initChat(userId);

        if (res.success && res.data?.chat_slug) {
            navigate(`/messages?dm=${res.data.chat_slug}`);
        } else {
            notifyError(res.message);
        }
        setIsChatLoading(false);
    };

    return (
        <div className="tetrone-actions">
            {!isBlockedByMe && permissions?.can_message && (
                <Button
                    onClick={handleSendMessage}
                    disabled={isChatLoading || loading}
                >
                    {isChatLoading ? '...' : t('messages.send_message')}
                </Button>
            )}

            {/* Дропдаун залишається без змін */}
            <div className="tetrone-dropdown-wrapper" ref={menuRef}>
                <Button
                    className="tetrone-btn-dropdown-trigger"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    disabled={loading}
                >
                    {getStatusLabel()}
                </Button>

                {isMenuOpen && (
                    <div className="tetrone-menu-list">
                        {!isBlockedByMe && (
                            <button className="tetrone-menu-item" onClick={() => { onFriendAction(); setIsMenuOpen(false); }}>
                                {getFriendActionLabel()}
                            </button>
                        )}

                        <button
                            className="tetrone-menu-item"
                            onClick={() => { onReportAction(); setIsMenuOpen(false); }}
                        >
                            {t('reports.title')}
                        </button>

                        <button
                            className={`tetrone-menu-item ${!isBlockedByMe ? 'danger' : ''}`}
                            onClick={() => { onBlockAction(); setIsMenuOpen(false); }}
                        >
                            {isBlockedByMe
                                ? t('common.to_unblock')
                                : t('common.to_block')
                            }
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}