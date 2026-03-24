import { useTranslation } from 'react-i18next';
import { useCreatePost } from "./hooks/useCreatePost";
import Editor from '../editor/Editor';
import AttachBar from './components/AttachBar';
import FormatBar from './components/FormatBar';
import MediaPreviews from './components/MediaPreviews';
import YouTubePreviews from './components/YouTubePreviews';
import PollCreator from './components/PollCreator';
import { PollIcon } from '../ui/Icons';

export default function CreatePostForm({ onSubmitSuccess }) {
    const { t } = useTranslation();

    const {
        content, setContent,
        pollData, setPollData,
        showPollCreator, setShowPollCreator,
        removedPreviews, toggleYouTubePreview,
        external, handleSubmit,
        files, previews, isDragging,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile
    } = useCreatePost(onSubmitSuccess);

    return (
        <div
            className={`tetrone-wall-input ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
        >
            <FormatBar />

            <Editor
                className="tetrone-form-textarea fixed-size"
                placeholder={isDragging ? t('wall.drop_files_here') : t('wall.write_post')}
                value={content}
                onChange={setContent}
            />

            {pollData && (
                <div
                    className="tetrone-attached-poll-preview"
                    onClick={() => setShowPollCreator(true)}
                    title={t('poll.click_to_edit')}
                >
                    <span className="tetrone-poll-preview-title">
                        <PollIcon width={16} height={16} className="tetrone-poll-icon-inline" /> {pollData.question}
                    </span>
                    <button
                        type="button"
                        className="tetrone-remove-poll-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPollData(null);
                        }}
                        title={t('poll.remove_poll')}
                    >
                        ✖
                    </button>
                </div>
            )}

            <MediaPreviews previews={previews} onRemove={removeFile} />

            <YouTubePreviews
                youtubeLinks={external.youtube}
                removedPreviews={removedPreviews}
                onToggle={toggleYouTubePreview}
            />

            <div className="tetrone-wall-actions">
                <div className="tetrone-wall-actions-left">
                    <AttachBar onFileSelect={handleFileSelect} />

                    {!pollData && (
                        <button
                            className="tetrone-add-poll-btn"
                            onClick={() => setShowPollCreator(true)}
                            title={t('poll.add_poll')}
                        >
                            <PollIcon width={20} height={20} />
                        </button>
                    )}
                </div>

                <button className="tetrone-btn" onClick={handleSubmit}>
                    {t('wall.send_btn')}
                </button>
            </div>

            {showPollCreator && (
                <div className="tetrone-modal-overlay" onClick={() => setShowPollCreator(false)}>
                    <div className="tetrone-modal-content vk-style tetrone-poll-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="tetrone-modal-header vk-blue">
                            <h3>{t('poll.create_title')}</h3>
                            <button className="vk-close-btn" onClick={() => setShowPollCreator(false)}>✖</button>
                        </div>
                        <div className="tetrone-pack-body">
                            <PollCreator
                                initialData={pollData}
                                onSave={(data) => {
                                    setPollData(data);
                                    setShowPollCreator(false);
                                }}
                                onCancel={() => setShowPollCreator(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}