import ImageAttach from '../../assets/ImageAttach.svg?react';

export default function CreatePostForm({
    content, setContent,
    preview, removeImage,
    isDragging, handleDragOver, handleDragLeave, handleDrop,
    handleFileSelect, handlePaste, handleSubmit
}) {
    return (
        <div
            className={`vk-wall-input ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <textarea
                placeholder={isDragging ? "Відпустіть картинку сюди..." : "Написати пост..."}
                value={content}
                onChange={e => setContent(e.target.value)}
                onPaste={(e) => handlePaste(e, 'create')}
                maxLength={2048}
            ></textarea>

            {preview && (
                <div className="vk-post-preview">
                    <img src={preview} alt="Preview" />
                    <button onClick={removeImage}>×</button>
                </div>
            )}

            <div className="vk-wall-actions">
                <label className="vk-attach-btn" title="Додати фото">
                    <input type="file" hidden onChange={handleFileSelect} accept="image/*" />
                    <ImageAttach width={20} height={20} />
                </label>
                <button className="vk-btn-small" onClick={handleSubmit}>Надіслати</button>
            </div>
        </div>
    );
}