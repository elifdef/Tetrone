import DocumentAttach from '../../../assets/documentAttach.svg?react';

export default function MediaPreviews({ previews, onRemove, isExisting = false }) {
    if (!previews || !Array.isArray(previews) || previews.length === 0) return null;

    return (
        <div className="socnet-post-previews-container">
            {previews.map((preview, index) => {
                if (!preview) return null;

                const typeStr = String(preview.type || '').toLowerCase();
                const nameStr = String(preview.name || preview.original_name || 'File');

                const isImage = typeStr.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(nameStr);
                const isVideo = typeStr.includes('video') || /\.(mp4|mov|webm|mkv|avi)$/i.test(nameStr);

                const removeId = isExisting ? preview.id : index;
                const key = isExisting ? `exist-${preview.id}` : `new-${index}`;

                return (
                    <div key={key} className={`socnet-post-preview ${isExisting ? 'existing' : 'new'}`}>
                        {isImage ? (
                            <img src={preview.url} alt="Preview" />
                        ) : isVideo ? (
                            <video src={preview.url} muted className="socnet-preview-video" />
                        ) : (
                            <div className="socnet-preview-file-stub">
                                <DocumentAttach width={24} height={24} />
                                <span className="socnet-preview-filename" title={nameStr}>
                                    {nameStr}
                                </span>
                            </div>
                        )}
                        <button
                            type="button"
                            className="socnet-preview-remove-btn"
                            onClick={() => onRemove(removeId)}
                        >
                            ×
                        </button>
                    </div>
                );
            })}
        </div>
    );
}