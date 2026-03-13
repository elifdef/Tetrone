import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError } from "../../common/Notify";
import { MAX_FILE_SIZE_KB } from "../../../config";

export const usePostForm = (initialFilesCount = 0) => {
    const { t } = useTranslation();
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const addFiles = (filesList) => {
        if (!filesList || filesList.length === 0) return;

        const validFiles = [];
        let hasOversized = false;

        Array.from(filesList).forEach(file => {
            if (!file) return;

            if (file.size > MAX_FILE_SIZE_KB * 1024) {
                hasOversized = true;
            } else {
                validFiles.push(file);
            }
        });

        if (hasOversized) {
            notifyError(t('error.file_too_large', { size: MAX_FILE_SIZE_KB / 1024 }));
        }

        if (initialFilesCount + files.length + validFiles.length > 10) {
            notifyError(t('error.max_files'));
            return;
        }

        if (validFiles.length === 0) return;

        setFiles(prev => [...prev, ...validFiles]);

        const newPreviews = validFiles.map(f => {
            let fileUrl = '';
            try {
                fileUrl = URL.createObjectURL(f);
            } catch (e) {
                console.error("Помилка створення URL", e);
            }
            return {
                url: fileUrl,
                type: f.type || '',
                name: f.name || 'Unknown file'
            };
        });

        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    };

    const handleFileSelect = (e) => {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = '';
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const pastedFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                pastedFiles.push(items[i].getAsFile());
            }
        }
        if (pastedFiles.length > 0) {
            e.preventDefault();
            addFiles(pastedFiles);
        }
    };

    const removeFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setPreviews(prev => {
            const updated = [...prev];
            const removedItem = updated.splice(indexToRemove, 1)[0];
            if (removedItem && removedItem.url) {
                URL.revokeObjectURL(removedItem.url);
            }
            return updated;
        });
    };

    const clearFiles = () => {
        setFiles([]);
        previews.forEach(p => {
            if (p && p.url) URL.revokeObjectURL(p.url);
        });
        setPreviews([]);
    };

    return {
        files, previews, isDragging,
        handleDragOver, handleDragLeave, handleDrop,
        handleFileSelect, handlePaste, removeFile, clearFiles
    };
};