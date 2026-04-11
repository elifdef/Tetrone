import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { AuthContext } from '../../context/AuthContext';

export default function ChatInfoModal({ chat, messages, onClose, onScrollToMessage, onDeleteChat, onBlockUser }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { user: currentUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('media');

    if (!chat) return null;

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
        <div className="tetrone-messages-old-info-modal-content">
            <div className="tetrone-messages-old-chat-header">
                {t('messages.chat_info')}
                <button className="tetrone-old-modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="tetrone-old-info-profile">
                <Link to={`/${chat.target_user?.username}`}>
                    <img src={chat.target_user?.avatar} alt="avatar" />
                </Link>
                <div className="tetrone-old-info-details">
                    <Link to={`/${chat.target_user?.username}`} className="tetrone-messages-old-author">
                        {chat.target_user?.first_name} {chat.target_user?.last_name}
                    </Link>
                    <span className="tetrone-messages-old-date">@{chat.target_user?.username}</span>
                    <div className="tetrone-messages-old-date">
                        {t('messages.chat_started')}: {initiatorName} ({formatDate(chat.created_at)})
                    </div>
                    <div className="tetrone-old-info-actions">
                        <span className="tetrone-action-link danger" onClick={onBlockUser}>
                            {t('action.block')}
                        </span>
                        <span className="tetrone-action-link danger" onClick={onDeleteChat}>
                            {t('messages.delete_for_both')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="tetrone-messages-old-tabs">
                <span className={`tetrone-messages-old-tab ${activeTab === 'media' ? 'active' : 'link'}`} onClick={() => setActiveTab('media')}>
                    {t('messages.tab_media')} <span className="tetrone-tab-count">{mediaFiles.length}</span>
                </span>
                <span className={`tetrone-messages-old-tab ${activeTab === 'files' ? 'active' : 'link'}`} onClick={() => setActiveTab('files')}>
                    {t('messages.tab_files')} <span className="tetrone-tab-count">{documentFiles.length}</span>
                </span>
            </div>

            <div className="tetrone-old-info-content">
                {activeTab === 'media' && (
                    <div className="tetrone-old-info-media-grid">
                        {mediaFiles.length > 0 ? mediaFiles.map((file, idx) => (
                            <div key={idx} className="tetrone-old-info-media-wrapper" onClick={() => handleMediaClick(file.messageId)} title={t('messages.go_to_message')}>
                                {file.name.match(/\.(mp4|webm)$/i) ? (
                                    <div className="tetrone-old-info-video-stub">🎥 {t('action.attach_video')}</div>
                                ) : (
                                    <img src={file.url} alt="attachment" className="tetrone-old-info-grid-img" />
                                )}
                            </div>
                        )) : <div className="tetrone-empty-state">{t('empty.inbox')}</div>}
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="tetrone-old-info-files-list">
                        {documentFiles.length > 0 ? documentFiles.map((file, idx) => (
                            <div key={idx} className="tetrone-old-info-file-row">
                                <a href={file.url} target="_blank" rel="noreferrer" className="tetrone-action-link">📎 {file.name}</a>
                                <span className="tetrone-messages-old-date">{formatDate(file.createdAt)}</span>
                                <span className="tetrone-action-link" onClick={() => handleMediaClick(file.messageId)}>➜</span>
                            </div>
                        )) : <div className="tetrone-empty-state">{t('empty.documents')}</div>}
                    </div>
                )}
            </div>
        </div>
    );
}