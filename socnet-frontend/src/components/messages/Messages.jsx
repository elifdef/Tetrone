import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { NotificationContext } from '../../context/NotificationContext';
import Textarea from '../UI/Textarea';
import MessageItem from './MessageItem';
import ChatScrollContainer from '../common/ChatScrollContainer';
import "./modernStyle.css";

const ImagePreview = ({ file, onRemove }) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]);

    return (
        <div className="socnet-tg-preview-item">
            {url ? (
                <img src={url} alt="preview" className="socnet-tg-preview-img" />
            ) : (
                <div className="socnet-tg-file-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" /></svg>
                </div>
            )}
            <button className="socnet-tg-remove-preview" onClick={onRemove}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
        </div>
    );
};

export default function Messages(props) {
    const {
        currentUser, chats, messages, activeChat, dmSlug, text, setText, files, editingMessage,
        handleSend, handleSelectChat, handleBackToInbox, handleEditClick,
        handleCancelEdit, handleDelete, handleFileChange, handleRemoveFile,
        isLoadingInitial, isLoadingMore, hasMore, onLoadMore,
        onOpenInfo, setReplyingTo, togglePin, replyingTo, handleCancelReplyEdit,
        onTyping, isTyping
    } = props;

    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const attachMenuRef = useRef(null);

    const [sidebarWidth, setSidebarWidth] = useState(350);

    const { onlineUsers } = useContext(NotificationContext) || { onlineUsers: [] };
    const pinnedMessage = messages.find(m => m.is_pinned);

    const isOnline = (lastSeenDate) => {
        if (!lastSeenDate) return false;
        return (new Date() - new Date(lastSeenDate)) < 3 * 60 * 1000;
    };
    const targetOnline = onlineUsers?.includes(activeChat?.target_user?.id) || isOnline(activeChat?.target_user?.last_seen_at);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) setIsAttachOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const handleTextChange = (e) => {
        setText(e.target.value);
        if (onTyping) onTyping();
    };

    const handleScrollToMessage = (msgId) => {
        const el = document.getElementById(`message-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('socnet-tg-highlight-msg');
            setTimeout(() => el.classList.remove('socnet-tg-highlight-msg'), 2000);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="socnet-tg-layout">
            <div
                className={`socnet-tg-sidebar ${activeChat ? 'hidden-on-mobile' : ''}`}
                style={{ width: `${sidebarWidth}px` }}
            >
                <div className="socnet-tg-chat-list">
                    {chats.map(chat => (
                        <div key={chat.slug} className={`socnet-tg-chat-item ${dmSlug === chat.slug ? 'active' : ''}`} onClick={() => handleSelectChat(chat.slug)}>
                            <img src={chat.target_user?.avatar} alt="avatar" className="socnet-tg-avatar" />
                            <div className="socnet-tg-chat-info">
                                <div className="socnet-tg-chat-top">
                                    <span className="socnet-tg-chat-name">{chat.target_user?.first_name} {chat.target_user?.last_name}</span>
                                    <span className="socnet-tg-chat-time">{formatDate(chat.updated_at, true)}</span>
                                </div>
                                <div className="socnet-tg-chat-preview">
                                    <span className="socnet-tg-preview-text">
                                        {chat.last_message_sender_id === currentUser?.id && <span className="socnet-tg-you-prefix">{t('common.you')}: </span>}
                                        {chat.last_message}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {chats.length === 0 && <div className="socnet-tg-empty-inbox">{t('messages.empty_inbox')}</div>}
                </div>
            </div>

            <div className="socnet-tg-resizer" onMouseDown={handleMouseDown}></div>
            <div className={`socnet-tg-main ${!activeChat ? 'hidden-on-mobile' : ''}`}>
                {!activeChat ? (
                    <div className="socnet-tg-empty-state">
                        <span className="socnet-tg-empty-badge">{t('messages.select_chat')}</span>
                    </div>
                ) : (
                    <>
                        <div className="socnet-tg-chat-header">
                            <button className="socnet-tg-back-btn" onClick={handleBackToInbox}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                            </button>

                            <div className="socnet-tg-header-info" onClick={onOpenInfo}>
                                <span className="socnet-tg-header-name">{activeChat.target_user?.first_name} {activeChat.target_user?.last_name}</span>
                                <span className={`socnet-tg-header-status ${targetOnline || isTyping ? 'online' : ''}`}>
                                    {isTyping ? (
                                        <span className="socnet-tg-typing-text">
                                            {t('common.typing')}
                                            <span className="socnet-tg-typing-dots"><span></span><span></span><span></span></span>
                                        </span>
                                    ) : targetOnline ? (
                                        t('messages.online')
                                    ) : (
                                        activeChat.target_user?.last_seen_at ? formatDate(activeChat.target_user.last_seen_at) : ''
                                    )}
                                </span>
                            </div>

                            <button onClick={onOpenInfo} className="socnet-tg-header-btn" title={t('messages.chat_info')}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                </svg>
                            </button>
                        </div>

                        {pinnedMessage && (
                            <div className="socnet-tg-pinned-bar" onClick={() => handleScrollToMessage(pinnedMessage.id)}>
                                <div className="socnet-tg-pinned-line"></div>
                                <div className="socnet-tg-pinned-content">
                                    <span className="socnet-tg-pinned-title">{t('messages.pinned_message')}</span>
                                    <span className="socnet-tg-pinned-text">{pinnedMessage.text || t('messages.media')}</span>
                                </div>
                                <button className="socnet-tg-pinned-close" onClick={(e) => { e.stopPropagation(); togglePin(pinnedMessage.id); }}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                                </button>
                            </div>
                        )}

                        <ChatScrollContainer
                            className="socnet-tg-history-scroll"
                            messagesLength={messages.length}
                            isLoadingMore={isLoadingMore}
                            isLoadingInitial={isLoadingInitial}
                            hasMore={hasMore}
                            onLoadMore={onLoadMore}
                        >
                            {messages.length === 0 && !isLoadingInitial ? (
                                <div className="socnet-tg-empty-messages">{t('messages.no_messages_yet')}</div>
                            ) : (
                                <div className="socnet-tg-messages-history">
                                    {messages.map(msg => (
                                        <MessageItem
                                            key={`mod-${msg.id}`}
                                            msg={msg}
                                            targetUser={activeChat.target_user}
                                            formatDate={formatDate}
                                            t={t}
                                            handleEditClick={handleEditClick}
                                            handleDelete={handleDelete}
                                            setReplyingTo={setReplyingTo}
                                            togglePin={togglePin}
                                        />
                                    ))}
                                </div>
                            )}
                        </ChatScrollContainer>

                        <div className="socnet-tg-composer">
                            {(editingMessage || replyingTo) && (
                                <div className="socnet-tg-reply-bar">
                                    <div className="socnet-tg-reply-icon">
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                                    </div>
                                    <div className="socnet-tg-reply-content">
                                        <span className="socnet-tg-reply-title">{editingMessage ? t('messages.editing') : replyingTo.sender_name}</span>
                                        <span className="socnet-tg-reply-text">{editingMessage ? editingMessage.text : replyingTo.text}</span>
                                    </div>
                                    <button className="socnet-tg-reply-close" onClick={handleCancelReplyEdit}>
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                                    </button>
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className="socnet-tg-previews-container">
                                    {files.map((f, idx) => (
                                        <ImagePreview key={idx} file={f} onRemove={() => handleRemoveFile(idx)} />
                                    ))}
                                </div>
                            )}

                            <div className="socnet-tg-input-row">
                                <div className="socnet-tg-attach-wrapper" ref={attachMenuRef}>
                                    <button className="socnet-tg-attach-btn" onClick={() => setIsAttachOpen(!isAttachOpen)}>
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-3.31-2.69-6-6-6S3 1.69 3 5v12.5c0 3.86 3.14 7 7 7s7-3.14 7-7V6h-1.5z" /></svg>
                                    </button>
                                    {isAttachOpen && (
                                        <div className="socnet-tg-attach-dropdown">
                                            <label>
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                                                {t('messages.attach_image')}
                                                <input type="file" accept="image/*,video/*" multiple className="socnet-hidden-input" onChange={(e) => { handleFileChange(e); setIsAttachOpen(false); }} />
                                            </label>
                                            <label>
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                                {t('messages.attach_file')}
                                                <input type="file" multiple className="socnet-hidden-input" onChange={(e) => { handleFileChange(e); setIsAttachOpen(false); }} />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <Textarea
                                    className="socnet-tg-textarea"
                                    placeholder={t('messages.type_message')}
                                    value={text}
                                    onChange={handleTextChange}
                                    onKeyDown={handleKeyDown}
                                />

                                {text.trim() || files.length > 0 ? (
                                    <button className="socnet-tg-send-btn active" onClick={handleSend}>
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                    </button>
                                ) : (
                                    <button className="socnet-tg-send-btn">
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}