import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePostMedia } from "../post/hooks/usePostMedia";
import { usePostForm } from "./hooks/usePostForm";
import { notifyError } from "../common/Notify";
import Textarea from "../UI/Textarea";
import AttachBar from './components/AttachBar';
import FormatBar from './components/FormatBar';
import MediaPreviews from './components/MediaPreviews';
import YouTubePreviews from './components/YouTubePreviews';

export default function CreatePostForm({ onSubmitSuccess }) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [removedPreviews, setRemovedPreviews] = useState([]);
    const { external } = usePostMedia(content, [], { removed_previews: removedPreviews });

    const {
        files, previews, isDragging,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile, clearFiles
    } = usePostForm(0);

    const toggleYouTubePreview = (videoId) => {
        setRemovedPreviews(prev =>
            prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
        );
    };

    const handleSubmit = async () => {
        if (!content.trim() && files.length === 0) {
            notifyError(t('post.empty_post'));
            return;
        }

        const entities = { removed_previews: removedPreviews };
        const success = await onSubmitSuccess(content, files, entities);

        if (success) {
            setContent('');
            setRemovedPreviews([]);
            clearFiles();
        }
    };

    return (
        <div
            className={`socnet-wall-input ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <FormatBar />

            <Textarea
                className="socnet-form-textarea fixed-size"
                placeholder={isDragging ? t('wall.drop_files_here') : t('wall.write_post')}
                value={content}
                onChange={e => setContent(e.target.value)}
                onPaste={handlePaste}
                maxLength={2048}
            />

            <MediaPreviews previews={previews} onRemove={removeFile} />

            <YouTubePreviews
                youtubeLinks={external.youtube}
                removedPreviews={removedPreviews}
                onToggle={toggleYouTubePreview}
            />

            <div className="socnet-wall-actions">
                <AttachBar onFileSelect={handleFileSelect} />

                <button className="socnet-btn" onClick={handleSubmit}>
                    {t('wall.send_btn')}
                </button>
            </div>
        </div>
    );
}