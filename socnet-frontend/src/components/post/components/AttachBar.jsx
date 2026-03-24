import { useTranslation } from 'react-i18next';
import { ImageIcon, VideoIcon, AudioIcon, DocumentIcon, PollIcon } from '../../ui/Icons';

export default function AttachBar({ onFileSelect }) {
    const { t } = useTranslation();

    return (
        <div className="tetrone-attach-buttons">
            <label className="tetrone-attach-btn tetrone-pointer" title={t('wall.attach_photo')}>
                <input type="file" multiple className="tetrone-hidden-input" onChange={onFileSelect} accept="image/*" />
                <ImageIcon />
            </label>

            <label className="tetrone-attach-btn tetrone-pointer" title={t('wall.attach_video')}>
                <input type="file" multiple className="tetrone-hidden-input" onChange={onFileSelect} accept="video/*" />
                <VideoIcon />
            </label>

            <label className="tetrone-attach-btn tetrone-pointer" title={t('wall.attach_audio')}>
                <input type="file" multiple className="tetrone-hidden-input" onChange={onFileSelect} accept="audio/*" />
                <AudioIcon />
            </label>

            <label className="tetrone-attach-btn tetrone-pointer" title={t('wall.attach_document')}>
                <input type="file" multiple className="tetrone-hidden-input" onChange={onFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" />
                <DocumentIcon />
            </label>
        </div>
    );
}