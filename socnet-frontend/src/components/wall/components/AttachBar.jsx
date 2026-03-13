import { useTranslation } from 'react-i18next';
import ImageAttach from '../../../assets/imageAttach.svg?react';
import VideoAttach from '../../../assets/videoAttach.svg?react';
import AudioAttach from '../../../assets/audioAttach.svg?react';
import DocumentAttach from '../../../assets/documentAttach.svg?react';

export default function AttachBar({ onFileSelect }) {
    const { t } = useTranslation();

    return (
        <div className="socnet-attach-buttons">
            <label className="socnet-attach-btn" title={t('wall.attach_photo')} style={{ cursor: 'pointer' }}>
                <input type="file" multiple style={{ display: 'none' }} onChange={onFileSelect} accept="image/*" />
                <ImageAttach width={20} height={20} />
            </label>
            
            <label className="socnet-attach-btn" title={t('wall.attach_video')} style={{ cursor: 'pointer' }}>
                <input type="file" multiple style={{ display: 'none' }} onChange={onFileSelect} accept="video/*" />
                <VideoAttach width={20} height={20} />
            </label>
            
            <label className="socnet-attach-btn" title={t('wall.attach_audio')} style={{ cursor: 'pointer' }}>
                <input type="file" multiple style={{ display: 'none' }} onChange={onFileSelect} accept="audio/*" />
                <AudioAttach width={20} height={20} />
            </label>
            
            <label className="socnet-attach-btn" title={t('wall.attach_document')} style={{ cursor: 'pointer' }}>
                <input type="file" multiple style={{ display: 'none' }} onChange={onFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" />
                <DocumentAttach width={20} height={20} />
            </label>
        </div>
    );
}