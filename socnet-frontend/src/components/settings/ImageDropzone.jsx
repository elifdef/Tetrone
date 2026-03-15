import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ImageDropzone = ({ onFileSelect, fileName }) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            onFileSelect({ target: { files: [file] } });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    useEffect(() => {
        const handlePaste = (e) => {
            const tagName = e.target.tagName?.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea') return;

            if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                processFile(e.clipboardData.files[0]);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onFileSelect]);

    return (
        <div
            className={`socnet-avatar-dropzone ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="socnet-hidden-input"
                accept="image/*"
                onChange={(e) => onFileSelect(e)}
            />

            <div className="socnet-dropzone-content">
                <div className="socnet-dropzone-text">
                    <strong>{t('common.drag_and_drop')}</strong> {t('common.or_paste')} (Ctrl+V)
                </div>
            </div>
            {fileName && (
                <div className="socnet-dropzone-filename">
                    {t('common.selected_file')}: <strong>{fileName}</strong>
                </div>
            )}
        </div>
    );
};

export default ImageDropzone;