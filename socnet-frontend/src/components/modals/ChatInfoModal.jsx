import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const VideoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const AudioIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

const DocIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

export default function ChatInfoModal({ chat, messages, onClose }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('photos');

    const categorizedFiles = useMemo(() => {
        const allFiles = [];
        messages.forEach(msg => {
            if (msg.files?.length > 0) {
                msg.files.forEach(file => allFiles.push(file));
            }
        });

        return {
            photos: allFiles.filter(f => f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)),
            videos: allFiles.filter(f => f.name.match(/\.(mp4|webm|mov|avi)$/i)),
            audio: allFiles.filter(f => f.name.match(/\.(mp3|wav|ogg)$/i)),
            docs: allFiles.filter(f => !f.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi|mp3|wav|ogg)$/i))
        };
    }, [messages]);

    const renderContent = () => {
        if (activeTab === 'photos') {
            if (!categorizedFiles.photos.length) {
                return <div className="tetrone-chat-info-empty">{t('empty.photos')}</div>;
            }
            return (
                <div className="tetrone-chat-info-grid">
                    {categorizedFiles.photos.map((photo, i) => (
                        <div key={i} className="tetrone-chat-info-grid-item">
                            <img src={photo.url} alt={t('messages.photos')} />
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'videos') {
            if (!categorizedFiles.videos.length) {
                return <div className="tetrone-chat-info-empty">{t('empty.videos')}</div>;
            }
            return (
                <div className="tetrone-chat-info-grid">
                    {categorizedFiles.videos.map((video, i) => (
                        <div key={i} className="tetrone-chat-info-grid-item">
                            <VideoIcon />
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'audio') {
            if (!categorizedFiles.audio.length) {
                return <div className="tetrone-chat-info-empty">{t('empty.audio')}</div>;
            }
            return (
                <div className="tetrone-chat-info-list">
                    {categorizedFiles.audio.map((audio, i) => (
                        <div key={i} className="tetrone-chat-info-list-item">
                            <div className="tetrone-chat-info-icon-wrapper"><AudioIcon /></div>
                            <a href={audio.url} target="_blank" rel="noreferrer" className="tetrone-chat-info-link">
                                {audio.name}
                            </a>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'docs') {
            if (!categorizedFiles.docs.length) {
                return <div className="tetrone-chat-info-empty">{t('empty.documents')}</div>;
            }
            return (
                <div className="tetrone-chat-info-list">
                    {categorizedFiles.docs.map((doc, i) => (
                        <div key={i} className="tetrone-chat-info-list-item">
                            <div className="tetrone-chat-info-icon-wrapper"><DocIcon /></div>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="tetrone-chat-info-link">
                                {doc.name}
                            </a>
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="tetrone-chat-info-overlay" onClick={onClose}>
            <div className="tetrone-chat-info-dialog" onClick={e => e.stopPropagation()}>
                <div className="tetrone-chat-info-header">
                    <h3 className="tetrone-chat-info-title">{t('messages.history')}</h3>
                    <button className="tetrone-chat-info-close" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                <div className="tetrone-chat-info-tabs">
                    <div className={`tetrone-chat-info-tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
                        {t('messages.photos')} <span className="tetrone-chat-info-count">{categorizedFiles.photos.length}</span>
                    </div>
                    <div className={`tetrone-chat-info-tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
                        {t('messages.videos')} <span className="tetrone-chat-info-count">{categorizedFiles.videos.length}</span>
                    </div>
                    <div className={`tetrone-chat-info-tab ${activeTab === 'audio' ? 'active' : ''}`} onClick={() => setActiveTab('audio')}>
                        {t('messages.audio')} <span className="tetrone-chat-info-count">{categorizedFiles.audio.length}</span>
                    </div>
                    <div className={`tetrone-chat-info-tab ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
                        {t('messages.documents')} <span className="tetrone-chat-info-count">{categorizedFiles.docs.length}</span>
                    </div>
                </div>

                <div className="tetrone-chat-info-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}