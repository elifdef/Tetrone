import { useTranslation } from 'react-i18next';
import VideoPlayer from '../../ui/VideoPlayer';
import { DocumentIcon } from "../../ui/Icons";

export default function MediaPreviews({ previews, onRemove, isExisting = false }) {
    const { t } = useTranslation();

    if (!previews || !Array.isArray(previews) || previews.length === 0) return null;

    const videos = [];
    const others = [];

    previews.forEach((preview, index) => {
        if (!preview) return;

        const typeStr = String(preview.type || '').toLowerCase();
        const nameStr = String(preview.name || preview.original_name || 'File');

        const isVideo = typeStr.includes('video') || /\.(mp4|mov|webm|mkv|avi)$/i.test(nameStr);
        const isImage = typeStr.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(nameStr);

        const isFileObject = preview instanceof File || preview instanceof Blob;
        const srcUrl = isFileObject ? URL.createObjectURL(preview) + '#t=0.1' : preview.url;

        const item = { preview, index, nameStr, srcUrl, isImage };

        if (isVideo) {
            videos.push(item);
        } else {
            others.push(item);
        }
    });

    return (
        <>
            {others.length > 0 && (
                <div className="tetrone-post-previews-container">
                    {others.map(({ preview, index, nameStr, srcUrl, isImage }) => {
                        const removeId = isExisting ? preview.id : index;
                        const key = isExisting ? `exist-other-${preview.id}` : `new-other-${index}`;

                        return (
                            <div key={key} className={`tetrone-post-preview ${isExisting ? 'existing' : 'new'}`}>
                                {isImage ? (
                                    <img src={srcUrl} alt={t('common.preview')} />
                                ) : (
                                    <div className="tetrone-preview-file-stub">
                                        <DocumentIcon width={24} height={24} />
                                        <span className="tetrone-preview-filename" title={nameStr}>
                                            {nameStr}
                                        </span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="tetrone-preview-remove-btn"
                                    onClick={() => onRemove(removeId)}
                                    title={t('action.delete')}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {videos.length > 0 && (
                <div className="tetrone-post-videos-container">
                    {videos.map(({ preview, index, srcUrl }) => {
                        const removeId = isExisting ? preview.id : index;
                        const key = isExisting ? `exist-video-${preview.id}` : `new-video-${index}`;

                        return (
                            <div key={key} className="tetrone-preview-video-wrapper">
                                <button
                                    type="button"
                                    className="tetrone-preview-remove-video-btn"
                                    onClick={() => onRemove(removeId)}
                                    title={t('action.delete')}
                                >
                                    ×
                                </button>

                                <div className="tetrone-video-preview-inner">
                                    <VideoPlayer src={srcUrl} provider="html5" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}