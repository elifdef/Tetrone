import { useState, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { NotificationContext } from '../../context/NotificationContext';
import MessageItem from './MessageItem';
import ChatScrollContainer from '../common/ChatScrollContainer';
import ChatComposer from './ChatComposer';
import { extractPreviewText } from '../../utils/messageParser';
import { BackIcon, CloseIcon, DeleteIcon } from '../ui/Icons';
import "../../styles/chat-modern.css";

export default function Messages(props) {
    const {
        currentUser, chats, messages, activeChat, dmSlug, text, setText, files, editingMessage,
        handleSend, handleSelectChat, handleBackToInbox, handleEditClick,
        handleDelete, handleFileChange, handleRemoveFile,
        isLoadingInitial, isLoadingMore, hasMore, onLoadMore,
        onOpenInfo, setReplyingTo, togglePin, replyingTo, handleCancelReplyEdit,
        onTyping, isTyping, replyingToName, onDeleteChatClick
    } = props;

    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const [sidebarWidth, setSidebarWidth] = useState(350);
    const { onlineUsers } = useContext(NotificationContext);

    const safeMessages = messages || [];
    const safeChats = chats || [];

    const pinnedMessage = safeMessages.find(m => m.is_pinned);
    const targetOnline = onlineUsers?.includes(activeChat?.target_user?.id) ||
        (activeChat?.target_user?.last_seen_at && (new Date() - new Date(activeChat.target_user.last_seen_at)) < 3 * 60 * 1000);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        const handleMouseMove = (moveEvent) => {
            let newWidth = moveEvent.clientX;
            if (newWidth < 250) newWidth = 250;
            if (newWidth > 600) newWidth = 600;
            setSidebarWidth(newWidth);
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const handleScrollToMessage = (msgId) => {
        const el = document.getElementById(`message-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('tetrone-modern-highlight-msg');
            setTimeout(() => el.classList.remove('tetrone-modern-highlight-msg'), 2000);
        }
    };

    return (
        <div className="tetrone-modern-layout">
            <div className={`tetrone-modern-sidebar ${activeChat ? 'hidden-on-mobile' : ''}`} style={{ width: `${sidebarWidth}px` }}>
                <div className="tetrone-modern-chat-list">
                    {safeChats.map(chat => (
                        <div key={chat.slug} className={`tetrone-modern-chat-item ${dmSlug === chat.slug ? 'active' : ''}`} onClick={() => handleSelectChat(chat.slug)}>
                            <img src={chat.target_user?.avatar} className="tetrone-modern-avatar" />
                            <div className="tetrone-modern-chat-info">
                                <div className="tetrone-modern-chat-top">
                                    <span className="tetrone-modern-chat-name">{chat.target_user?.first_name} {chat.target_user?.last_name}</span>
                                    <span className="tetrone-modern-chat-time">{formatDate(chat.updated_at, true)}</span>
                                </div>
                                <div className="tetrone-modern-preview-row">
                                    <span className="tetrone-modern-preview-text">
                                        {chat.last_message_sender_id === currentUser?.id && <span className="tetrone-modern-you-prefix">{t('common.you')}</span>}
                                        {extractPreviewText(chat.last_message, t)}
                                    </span>
                                    {chat.unread_count > 0 && (
                                        <span className="tetrone-modern-badge">
                                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {safeChats.length === 0 && <div className="tetrone-modern-empty-inbox">{t('empty.inbox')}</div>}
                </div>
            </div>

            <div className="tetrone-modern-resizer" onMouseDown={handleMouseDown}></div>

            <div className={`tetrone-modern-main ${!activeChat ? 'hidden-on-mobile' : ''}`}>
                {!activeChat ? (
                    <div className="tetrone-modern-empty-state">
                        <span className="tetrone-modern-empty-badge">{t('messages.select_chat')}</span>
                    </div>
                ) : (
                    <>
                        <div className="tetrone-modern-chat-header">
                            <button className="tetrone-modern-back-btn" onClick={handleBackToInbox}>
                                <BackIcon />
                            </button>
                            <div className="tetrone-modern-header-info" onClick={onOpenInfo}>
                                <span className="tetrone-modern-header-name">{activeChat.target_user?.first_name} {activeChat.target_user?.last_name}</span>
                                <span className={`tetrone-modern-header-status ${targetOnline || isTyping ? 'online' : ''}`}>
                                    {isTyping ? (
                                        <span className="tetrone-modern-typing-text">
                                            {t('common.typing')}
                                            <span className="tetrone-modern-typing-dots"><span /><span /><span /></span>
                                        </span>
                                    ) : targetOnline ? t('common.online') : ''}
                                </span>
                            </div>
                            <button className="tetrone-modern-header-btn" onClick={onDeleteChatClick}>
                                <DeleteIcon width={20} height={20} />
                            </button>
                        </div>

                        {pinnedMessage && (
                            <div className="tetrone-modern-pinned-bar" onClick={() => handleScrollToMessage(pinnedMessage.id)}>
                                <div className="tetrone-modern-pinned-indicator"></div>
                                <div className="tetrone-modern-pinned-content">
                                    <span className="tetrone-modern-pinned-title">{t('messages.pinned_message')}</span>
                                    <span className="tetrone-modern-pinned-text">{extractPreviewText(pinnedMessage.text, t)}</span>
                                </div>
                                <button className="tetrone-modern-pinned-close" onClick={(e) => { e.stopPropagation(); togglePin(pinnedMessage.id); }}>
                                    <CloseIcon />
                                </button>
                            </div>
                        )}

                        <ChatScrollContainer
                            className="tetrone-modern-history-scroll"
                            messagesLength={safeMessages.length} isLoadingMore={isLoadingMore}
                            isLoadingInitial={isLoadingInitial} hasMore={hasMore} onLoadMore={onLoadMore}
                        >
                            {safeMessages.length === 0 && !isLoadingInitial ? (
                                <div className="tetrone-modern-empty-messages">{t('empty.messages')}</div>
                            ) : (
                                <div className="tetrone-modern-messages-history">
                                    {safeMessages.map(msg => (
                                        <MessageItem key={`mod-${msg.id}`} msg={msg} targetUser={activeChat.target_user} formatDate={formatDate} t={t} handleEditClick={handleEditClick} handleDelete={handleDelete} setReplyingTo={setReplyingTo} togglePin={togglePin} />
                                    ))}
                                </div>
                            )}
                        </ChatScrollContainer>

                        <ChatComposer
                            theme="modern"
                            text={text} setText={setText} files={files}
                            editingMessage={editingMessage} replyingTo={replyingTo}
                            replyingToName={replyingToName}
                            handleCancelReplyEdit={handleCancelReplyEdit} handleRemoveFile={handleRemoveFile}
                            handleFileChange={handleFileChange} handleSend={handleSend} onTyping={onTyping}
                            myAvatar={currentUser?.avatar}
                        />
                    </>
                )}
            </div>
        </div>
    );
}