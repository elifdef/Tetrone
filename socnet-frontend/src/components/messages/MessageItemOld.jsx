import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { NotificationContext } from '../../context/NotificationContext';
import MessageItemOld from './MessageItemOld';
import ChatScrollContainer from '../common/ChatScrollContainer';
import ChatComposer from './ChatComposer';
import { extractPreviewText } from '../../utils/messageParser';
import "../../styles/chat-old.css";

const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const CloseIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const PencilIcon = () => <svg className="typing-pencil-jerky" viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>;

export default function MessagesOld(props) {
    const {
        currentUser, chats, messages, activeChat, dmSlug, text, setText, files, editingMessage,
        handleSend, handleSelectChat, handleBackToInbox, handleEditClick,
        handleDelete, handleFileChange, handleRemoveFile,
        isLoadingInitial, isLoadingMore, hasMore, onLoadMore, onOpenInfo, onDeleteChatClick,
        setReplyingTo, togglePin, replyingTo, handleCancelReplyEdit,
        isTyping, onTyping, replyingToName
    } = props;

    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { onlineUsers } = useContext(NotificationContext) || { onlineUsers: [] };

    const pinnedMessage = messages.find(m => m.is_pinned);
    const targetOnline = onlineUsers?.includes(activeChat?.target_user?.id) ||
        (activeChat?.target_user?.last_seen_at && (new Date() - new Date(activeChat.target_user.last_seen_at)) < 3 * 60 * 1000);

    const handleScrollToMessage = (msgId) => {
        const el = document.getElementById(`message-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('tetrone-highlight-msg');
            setTimeout(() => el.classList.remove('tetrone-highlight-msg'), 2000);
        }
    };

    const getPinnedAvatar = () => {
        if (!pinnedMessage) return null;
        return pinnedMessage.isMine ? currentUser?.avatar : activeChat?.target_user?.avatar;
    };

    const getPinnedName = () => {
        if (!pinnedMessage) return '';
        return pinnedMessage.isMine ? currentUser?.first_name : activeChat?.target_user?.first_name;
    };

    if (!activeChat) {
        return (
            <div className="tetrone-messages-old-container">
                <div className="tetrone-messages-old-tabs">
                    <span className="tetrone-messages-old-tab active">{t('common.messages')}</span>
                </div>
                <div className="tetrone-messages-old-dialog-list">
                    {chats.map(chat => (
                        <div
                            key={chat.slug}
                            className={`tetrone-messages-old-dialog-item ${chat.unread_count > 0 ? 'unread' : ''}`}
                            onClick={() => handleSelectChat(chat.slug)}
                        >
                            <img src={chat.target_user?.avatar} alt="avatar" className="tetrone-messages-old-avatar" />
                            <div className="tetrone-messages-old-dialog-info">
                                <div className="tetrone-messages-old-dialog-header">
                                    <span className="tetrone-messages-old-link">{chat.target_user?.first_name} {chat.target_user?.last_name}</span>
                                    <span className="tetrone-messages-old-date">{formatDate(chat.updated_at)}</span>
                                </div>

                                <div className="tetrone-old-preview-row">
                                    <span className="tetrone-old-preview-text">
                                        {chat.last_message_sender_id === currentUser?.id ? <span className="tetrone-msg-preview-you">{t('common.you')}&nbsp;</span> : null}
                                        {extractPreviewText(chat.last_message, t)}
                                    </span>

                                    {chat.unread_count > 0 && (
                                        <span className="tetrone-old-badge">
                                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {chats.length === 0 && <div className="tetrone-empty-state">{t('empty.inbox')}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="tetrone-messages-old-container in-chat">
            <div className="tetrone-messages-old-chat-header-complex">
                <span className="tetrone-messages-old-tab link" onClick={handleBackToInbox}>{t('action.go_back')}</span>
                <div className="tetrone-im-header-center" onClick={onOpenInfo}>
                    <span className="tetrone-im-chat-title">{activeChat.target_user?.first_name} {activeChat.target_user?.last_name}</span>
                    <span className="tetrone-im-offline-text">
                        {isTyping ? (
                            <span className="tetrone-typing-old">
                                <PencilIcon />
                                {t('common.typing')}
                            </span>
                        ) : targetOnline ? (
                            <span className="tetrone-im-online-indicator">
                                <span className="tetrone-im-online-square" /> {t('common.online')}
                            </span>
                        ) : ''}
                    </span>
                </div>
                <div className="tetrone-im-header-actions">
                    <button onClick={onDeleteChatClick} className="tetrone-btn-old-icon"><TrashIcon /></button>
                </div>
            </div>

            {pinnedMessage && (
                <div className="tetrone-pinned-message-bar" onClick={() => handleScrollToMessage(pinnedMessage.id)}>
                    <img src={getPinnedAvatar()} alt="avatar" className="pinned-quote-avatar" />
                    <div className="pinned-quote-content">
                        <div className="pinned-author">{t('messages.pinned_message')} {getPinnedName()}</div>
                        <div className="pinned-text">{extractPreviewText(pinnedMessage.text, t)}</div>
                    </div>
                    <button className="pinned-close" onClick={(e) => { e.stopPropagation(); togglePin(pinnedMessage.id); }}><CloseIcon /></button>
                </div>
            )}

            <ChatScrollContainer
                className="tetrone-messages-old-history-scroll"
                messagesLength={messages.length} isLoadingMore={isLoadingMore}
                isLoadingInitial={isLoadingInitial} hasMore={hasMore} onLoadMore={onLoadMore}
            >
                {messages.length === 0 && !isLoadingInitial ? (
                    <div className="tetrone-empty-state">{t('empty.messages')}</div>
                ) : (
                    <div className="tetrone-messages-old-history">
                        {messages.map(msg => (
                            <MessageItemOld key={`old-${msg.id}`} msg={msg} myAvatar={currentUser?.avatar} myName={currentUser?.first_name} targetUser={activeChat.target_user} formatDate={formatDate} t={t} handleEditClick={handleEditClick} handleDelete={handleDelete} setReplyingTo={setReplyingTo} togglePin={togglePin} />
                        ))}
                    </div>
                )}
            </ChatScrollContainer>

            <ChatComposer
                theme="old"
                text={text} setText={setText} files={files}
                editingMessage={editingMessage} replyingTo={replyingTo}
                replyingToName={replyingToName}
                handleCancelReplyEdit={handleCancelReplyEdit} handleRemoveFile={handleRemoveFile}
                handleFileChange={handleFileChange} handleSend={handleSend} onTyping={onTyping}
                myAvatar={currentUser?.avatar}
                targetAvatar={activeChat.target_user?.avatar}
            />
        </div>
    );
}