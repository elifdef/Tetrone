import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { NotificationContext } from '../../context/NotificationContext';
import MessageItemOld from './MessageItemOld';
import ChatScrollContainer from '../common/ChatScrollContainer';
import ChatComposer from './ChatComposer';
import { extractPreviewText } from '../../utils/messageParser';
import { DeleteIcon, CloseIcon, PencilIcon } from '../ui/Icons';
import "../../styles/chat-old.css";

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
    const { onlineUsers } = useContext(NotificationContext);

    const safeMessages = Array.isArray(messages) ? messages : [];
    const safeChats = Array.isArray(chats) ? chats : [];

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
                    {safeChats.map(chat => (
                        <div
                            key={chat.slug}
                            className={`tetrone-messages-old-dialog-item ${chat.unread_count > 0 ? 'unread' : ''}`}
                            onClick={() => handleSelectChat(chat.slug)}
                        >
                            <img src={chat.target_user?.avatar} alt={t('chat.avatar')} className="tetrone-messages-old-avatar" />
                            <div className="tetrone-messages-old-dialog-info">
                                <div className="tetrone-messages-old-dialog-header">
                                    <span className="tetrone-messages-old-link">{chat.target_user?.first_name} {chat.target_user?.last_name}</span>
                                    <span className="tetrone-messages-old-date">{formatDate(chat.updated_at)}</span>
                                </div>

                                <div className="tetrone-old-preview-row">
                                    <span className="tetrone-old-preview-text">
                                        {chat.last_message_sender_id === currentUser?.id ? <span className="tetrone-msg-preview-you">{t('common.you')}</span> : null}
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
                    {safeChats.length === 0 && <div className="tetrone-empty-state">{t('messages.empty_inbox')}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="tetrone-messages-old-container in-chat">
            <div className="tetrone-messages-old-chat-header-complex">
                <span className="tetrone-messages-old-tab link" onClick={handleBackToInbox}>{t('common.back')}</span>
                <div className="tetrone-im-header-center" onClick={onOpenInfo}>
                    <span className="tetrone-im-chat-title">{activeChat.target_user?.first_name} {activeChat.target_user?.last_name}</span>
                    <span className="tetrone-im-offline-text">
                        {isTyping ? (
                            <span className="tetrone-typing-old">
                                <PencilIcon className="typing-pencil-jerky" />
                                {t('common.typing')}
                            </span>
                        ) : targetOnline ? (
                            <span className="tetrone-im-online-indicator">
                                <span className="tetrone-im-online-square" /> {t('messages.online')}
                            </span>
                        ) : ''}
                    </span>
                </div>
                <div className="tetrone-im-header-actions">
                    <button onClick={onDeleteChatClick} className="tetrone-btn-old-icon"><DeleteIcon /></button>
                </div>
            </div>

            {pinnedMessage && (
                <div className="tetrone-pinned-message-bar" onClick={() => handleScrollToMessage(pinnedMessage.id)}>
                    <img src={getPinnedAvatar()} alt={t('chat.avatar')} className="pinned-quote-avatar" />
                    <div className="pinned-quote-content">
                        <div className="pinned-author">{t('messages.pinned_message')} {getPinnedName()}</div>
                        <div className="pinned-text">{extractPreviewText(pinnedMessage.text, t)}</div>
                    </div>
                    <button className="pinned-close" onClick={(e) => { e.stopPropagation(); togglePin(pinnedMessage.id); }}><CloseIcon /></button>
                </div>
            )}

            <ChatScrollContainer
                className="tetrone-messages-old-history-scroll"
                messagesLength={safeMessages.length} isLoadingMore={isLoadingMore}
                isLoadingInitial={isLoadingInitial} hasMore={hasMore} onLoadMore={onLoadMore}
            >
                {safeMessages.length === 0 && !isLoadingInitial ? (
                    <div className="tetrone-empty-state">{t('messages.no_messages_yet')}</div>
                ) : (
                    <div className="tetrone-messages-old-history">
                        {safeMessages.map(msg => (
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