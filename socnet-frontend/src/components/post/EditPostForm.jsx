import { useTranslation } from 'react-i18next';
import { useEditPost } from "./hooks/useEditPost";
import Editor from '../editor/Editor';
import Button from "../ui/Button";
import AttachBar from './components/AttachBar';
import MediaPreviews from './components/MediaPreviews';
import YouTubePreviews from './components/YouTubePreviews';
import { PollIcon } from '../ui/Icons';

export default function EditPostForm({ post, saveEdit, cancelEditing }) {
    const { t } = useTranslation();

    const {
        editContent, setEditContent,
        existingMedia, removeExistingMedia,
        removedPreviews, toggleYouTubePreview,
        external, handleSave,
        previews: newPreviews, isDragging,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile: removeNewFile
    } = useEditPost(post, saveEdit);

    return (
        <div
            className={`tetrone-post tetrone-edit-mode ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
        >

            <Editor
                className="tetrone-form-textarea fixed-size"
                value={editContent}
                onChange={setEditContent}
            />

            {post?.entities?.poll && (
                <div className="tetrone-attached-poll-preview disabled">
                    <span className="tetrone-poll-preview-title">
                        <PollIcon width={16} height={16} className="tetrone-poll-icon-inline" /> {post.entities.poll.question}
                    </span>
                    <span className="tetrone-poll-locked-text">{t('poll.edit_locked')}</span>
                </div>
            )}

            <MediaPreviews previews={existingMedia} onRemove={removeExistingMedia} isExisting={true} />
            <MediaPreviews previews={newPreviews} onRemove={removeNewFile} />

            <YouTubePreviews
                youtubeLinks={external.youtube}
                removedPreviews={removedPreviews}
                onToggle={toggleYouTubePreview}
            />

            <div className="tetrone-edit-actions">
                <AttachBar onFileSelect={handleFileSelect} />

                <div className="tetrone-edit-buttons-right">
                    <Button variant='secondary' onClick={cancelEditing}>
                        {t('action.cancel')}
                    </Button>
                    <Button onClick={handleSave}>
                        {t('action.save')}
                    </Button>
                </div>
            </div>
        </div>
    );
}