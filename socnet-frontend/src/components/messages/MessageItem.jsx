import { useState } from 'react';

export default function MessageItem({ msg, targetUser, formatDate, t, handleEditClick, handleDelete, setReplyingTo, togglePin }) {
    const [showActions, setShowActions] = useState(false);

    const isTemp = msg.status === 'sending' || msg.status === 'error';

    return (
        <div
            id={`message-${msg.id}`}
            className={`socnet-tg-message-wrapper ${msg.isMine ? 'mine' : 'theirs'} ${msg.status === 'error' ? 'error-state' : ''}`}
            onMouseEnter={() => !isTemp && setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="socnet-tg-message-content">
                <div className="socnet-tg-message-bubble">

                    {!msg.isMine && targetUser && (
                        <div className="socnet-tg-msg-author-name">
                            {targetUser.first_name} {targetUser.last_name}
                        </div>
                    )}

                    {msg.reply_to && (
                        <div className="socnet-tg-reply-quote">
                            <div className="reply-author">{msg.reply_to.sender_name}</div>
                            <div className="reply-text">{msg.reply_to.text}</div>
                        </div>
                    )}

                    {msg.files?.length > 0 && (
                        <div className="socnet-tg-msg-files">
                            {msg.files.map((file, idx) => (
                                <img key={idx} src={file.url} alt="attachment" className="socnet-tg-image-attachment" />
                            ))}
                        </div>
                    )}

                    <div className="socnet-tg-msg-text">
                        {msg.text}

                        {msg.status === 'error' && (
                            <div className="socnet-message-error-indicator" title={msg.errorText}>
                                ❌ {t('messages.not_sent')}
                            </div>
                        )}

                        <span className="socnet-tg-msg-meta">
                            {msg.is_edited && <span className="socnet-tg-edited">{t('common.edited')}</span>}

                            <span className="socnet-tg-time">
                                {msg.status === 'sending' ? '⏱' : formatDate(msg.created_at, true)}
                            </span>

                            {msg.isMine && !isTemp && (
                                <span className={`socnet-tg-read-status ${msg.read_at ? 'is-read' : 'is-sent'}`}>
                                    {msg.read_at ? '✓✓' : '✓'}
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                <div className={`socnet-tg-message-actions-bottom ${showActions && !isTemp ? 'visible' : ''}`}>
                    <button onClick={() => setReplyingTo(msg)}>{t('common.reply')}</button>
                    <button onClick={() => togglePin(msg.id)}>
                        {msg.is_pinned ? t('messages.unpin') : t('messages.pin')}
                    </button>
                    {msg.isMine && (
                        <>
                            <button onClick={() => handleEditClick(msg)}>{t('common.edit')}</button>
                            <button onClick={() => handleDelete(msg.id)} className="socnet-text-danger">
                                {t('common.delete')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}