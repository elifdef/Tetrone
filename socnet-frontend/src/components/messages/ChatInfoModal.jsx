import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { AuthContext } from '../../context/AuthContext';

export default function ChatInfoModal({ isOpen, onClose, chat, messages, onScrollToMessage, onDeleteChat, onBlockUser }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { user: currentUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('media');

    if (!isOpen || !chat) return null;

    let initiatorName = chat.initiator_id === currentUser?.id ? t('common.you') : chat.target_user?.first_name;

    const allFilesWithContext = messages.flatMap(msg =>
        (msg.files || []).map(file => ({ ...file, messageId: msg.id, createdAt: msg.created_at }))
    );

    const sortedFiles = allFilesWithContext.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const mediaFiles = sortedFiles.filter(f => f.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i));
    const documentFiles = sortedFiles.filter(f => !f.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i));

    const handleMediaClick = (messageId) => {
        onClose();
        if (onScrollToMessage) {
            setTimeout(() => onScrollToMessage(messageId), 100);
        }
    };

    return (
        <div className="socnet-modal-overlay" onClick={onClose}>
            <div className="socnet-modal-dialog socnet-messages-old-info-modal" onClick={e => e.stopPropagation()}>

                <div className="socnet-messages-old-chat-header">
                    {t('messages.chat_info')}
                    <button className="socnet-old-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="socnet-old-info-profile">
                    <Link to={`/${chat.target_user?.username}`}>
                        <img src={chat.target_user?.avatar} alt="avatar" />
                    </Link>
                    <div className="socnet-old-info-details">
                        <Link to={`/${chat.target_user?.username}`} className="socnet-messages-old-author">
                            {chat.target_user?.first_name} {chat.target_user?.last_name}
                        </Link>
                        <span className="socnet-messages-old-date">@{chat.target_user?.username}</span>
                        <div className="socnet-messages-old-date">
                            {t('messages.chat_started')}: {initiatorName} ({formatDate(chat.created_at)})
                        </div>
                        <div className="socnet-old-info-actions">
                            <span className="socnet-action-link danger" onClick={onBlockUser}>
                                {t('common.block_user')}
                            </span>
                            <span className="socnet-action-link danger" onClick={onDeleteChat}>
                                {t('messages.delete_chat_both')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="socnet-messages-old-tabs">
                    <span className={`socnet-messages-old-tab ${activeTab === 'media' ? 'active' : 'link'}`} onClick={() => setActiveTab('media')}>
                        {t('messages.tab_media')} <span className="socnet-tab-count">{mediaFiles.length}</span>
                    </span>
                    <span className={`socnet-messages-old-tab ${activeTab === 'files' ? 'active' : 'link'}`} onClick={() => setActiveTab('files')}>
                        {t('messages.tab_files')} <span className="socnet-tab-count">{documentFiles.length}</span>
                    </span>
                </div>

                <div className="socnet-old-info-content">
                    {activeTab === 'media' && (
                        <div className="socnet-old-info-media-grid">
                            {mediaFiles.length > 0 ? mediaFiles.map((file, idx) => (
                                <div key={idx} className="socnet-old-info-media-wrapper" onClick={() => handleMediaClick(file.messageId)} title={t('messages.go_to_message')}>
                                    {file.name.match(/\.(mp4|webm)$/i) ? (
                                        <div className="socnet-old-info-video-stub">🎥 {t('messages.video')}</div>
                                    ) : (
                                        <img src={file.url} alt="attachment" className="socnet-old-info-grid-img" />
                                    )}
                                </div>
                            )) : <div className="socnet-empty-state">{t('messages.no_media_yet')}</div>}
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div className="socnet-old-info-files-list">
                            {documentFiles.length > 0 ? documentFiles.map((file, idx) => (
                                <div key={idx} className="socnet-old-info-file-row">
                                    <a href={file.url} target="_blank" rel="noreferrer" className="socnet-action-link">📎 {file.name}</a>
                                    <span className="socnet-messages-old-date">{formatDate(file.createdAt)}</span>
                                    <span className="socnet-action-link" onClick={() => handleMediaClick(file.messageId)}>➜</span>
                                </div>
                            )) : <div className="socnet-empty-state">{t('messages.no_files_yet')}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}