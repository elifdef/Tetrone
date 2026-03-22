import { useState } from 'react';

export default function MessageItem({ msg, targetUser, formatDate, t, handleEditClick, handleDelete, setReplyingTo, togglePin }) {
    const [showActions, setShowActions] = useState(false);

    const isTemp = msg.status === 'sending' || msg.status === 'error';

    return (
        <div
            id={`message-${msg.id}`}
            className={`tetrone-modern-message-wrapper ${msg.isMine ? 'mine' : 'theirs'} ${msg.status === 'error' ? 'error-state' : ''}`}
            onMouseEnter={() => !isTemp && setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="tetrone-modern-message-content">
                <div className="tetrone-modern-message-bubble">

                    {!msg.isMine && targetUser && (
                        <div className="tetrone-modern-msg-author-name">
                            {targetUser.first_name} {targetUser.last_name}
                        </div>
                    )}

                    {msg.reply_to && (
                        <div className="tetrone-modern-reply-quote">
                            <div className="reply-author">{msg.reply_to.sender_name}</div>
                            <div className="reply-text">{msg.reply_to.text}</div>
                        </div>
                    )}

                    {msg.files?.length > 0 && (
                        <div className="tetrone-modern-msg-files">
                            {msg.files.map((file, idx) => (
                                <img key={idx} src={file.url} alt="attachment" className="tetrone-modern-image-attachment" />
                            ))}
                        </div>
                    )}

                    <div className="tetrone-modern-msg-text">
                        {msg.text}

                        {msg.status === 'error' && (
                            <div className="tetrone-message-error-indicator" title={msg.errorText}>
                                ❌ {t('messages.not_sent')}
                            </div>
                        )}

                        <span className="tetrone-modern-msg-meta">
                            {msg.is_edited && <span className="tetrone-modern-edited">{t('common.edited')}</span>}

                            <span className="tetrone-modern-time">
                                {msg.status === 'sending' ? '⏱' : formatDate(msg.created_at, true)}
                            </span>

                            {msg.isMine && !isTemp && (
                                <span className={`tetrone-modern-read-status ${msg.read_at ? 'is-read' : 'is-sent'}`}>
                                    {msg.read_at ? '✓✓' : '✓'}
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                <div className={`tetrone-modern-message-actions-bottom ${showActions && !isTemp ? 'visible' : ''}`}>
                    <button onClick={() => setReplyingTo(msg)}>{t('common.reply')}</button>
                    <button onClick={() => togglePin(msg.id)}>
                        {msg.is_pinned ? t('messages.unpin') : t('messages.pin')}
                    </button>
                    {msg.isMine && (
                        <>
                            <button onClick={() => handleEditClick(msg)}>{t('common.edit')}</button>
                            <button onClick={() => handleDelete(msg.id)} className="tetrone-text-danger">
                                {t('common.delete')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}