import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import StickerService from '../../services/sticker.service';
import { notifyError, notifySuccess } from '../common/Notify';

export default function StickerPackManager({ existingPack = null, onSuccess, onCancel }) {
    const { t } = useTranslation();

    const [packId, setPackId] = useState(existingPack?.id || null);
    const [title, setTitle] = useState(existingPack?.title || '');
    const [isPublished, setIsPublished] = useState(existingPack?.is_published || false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(existingPack?.cover_url || null);

    const [stickers, setStickers] = useState(existingPack?.stickers || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSavePack = async () => {
        if (!title.trim()) {
            notifyError(t('stickers.err_empty_title'));
            return;
        }

        setIsSaving(true);
        try {
            const data = { title, is_published: isPublished, cover: coverFile };

            let response;
            if (packId) {
                response = await StickerService.updatePack(packId, data);
            } else {
                if (!coverFile) {
                    notifyError(t('stickers.err_no_cover'));
                    setIsSaving(false);
                    return;
                }
                response = await StickerService.createPack(data);
                setPackId(response.data.id);
            }

            notifySuccess(t(`api.success.${response.code}`));
            if (onSuccess && !packId) onSuccess(response.data);
        } catch (error) {
            notifyError(error.message || t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    const processFiles = async (files) => {
        if (!packId) {
            notifyError(t('stickers.save_pack_first'));
            return;
        }

        setIsSaving(true);
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

        for (const file of validFiles) {
            const defaultShortcode = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, '');

            try {
                const response = await StickerService.addSticker(packId, {
                    file: file,
                    shortcode: defaultShortcode || 'sticker',
                    keywords: defaultShortcode
                });

                if (response.success) {
                    setStickers(prev => [...prev, response.data]);
                }
            } catch (error) {
                // console.error('Upload failed');
            }
        }
        setIsSaving(false);
        notifySuccess(t('stickers.upload_complete'));
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }, [packId]);

    const handleStickerDelete = async (emojiId) => {
        if (!window.confirm(t('common.are_you_sure'))) return;

        try {
            await StickerService.deleteSticker(emojiId);
            setStickers(prev => prev.filter(e => e.id !== emojiId));
            notifySuccess(t('stickers.deleted'));
        } catch (error) {
            notifyError(error.message);
        }
    };

    const handleShortcodeChange = async (emojiId, newShortcode) => {
        try {
            await StickerService.updateSticker(emojiId, { shortcode: newShortcode });
            notifySuccess(t('common.saved'));
        } catch (error) {
            notifyError(error.message);
        }
    };

    return (
        <div className="tetrone-pack-manager">
            <div className="tetrone-setup-header">
                <h2 className="tetrone-setup-title">
                    {packId ? t('stickers.edit_pack') : t('stickers.create_pack')}
                </h2>
            </div>

            <div className="tetrone-setup-layout">
                <div className="tetrone-setup-form-col">
                    <label className="tetrone-form-label">{t('stickers.pack_title')}</label>
                    <input
                        type="text"
                        className="tetrone-form-input tetrone-setup-form-input-wrapper"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        maxLength={50}
                    />

                    <label className="tetrone-checkbox-label">
                        <input
                            type="checkbox"
                            className="tetrone-checkbox"
                            checked={isPublished}
                            onChange={e => setIsPublished(e.target.checked)}
                        />
                        {t('stickers.publish_in_catalog')}
                    </label>

                    <div className="tetrone-edit-actions tetrone-setup-actions-wrapper">
                        <button className="tetrone-btn" onClick={handleSavePack} disabled={isSaving}>
                            {isSaving ? t('common.saving') : t('common.save')}
                        </button>
                        {onCancel && (
                            <button className="tetrone-btn tetrone-btn-cancel" onClick={onCancel}>
                                {t('common.cancel')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="tetrone-setup-preview-col tetrone-setup-preview-center">
                    <div className="tetrone-preview-label">{t('stickers.cover')}</div>
                    <div
                        className="tetrone-pack-cover-img-preview"
                        onClick={() => fileInputRef.current.click()}
                    >
                        {coverPreview ? (
                            <img src={coverPreview} alt="Cover" />
                        ) : (
                            <div className="tetrone-pack-cover-placeholder">+</div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleCoverChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="tetrone-hidden-input"
                    />
                </div>
            </div>

            {packId && (
                <div className="tetrone-pack-items-manager">
                    <div className="tetrone-section-title tetrone-section-title-spaced">
                        {t('stickers.stickers_list')}
                    </div>

                    <div
                        className={`tetrone-avatar-dropzone tetrone-dropzone-spaced ${isDragging ? 'drag-active' : ''}`}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <div className="tetrone-dropzone-text">
                            {t('stickers.drop_stickers_here')}
                        </div>
                    </div>

                    {stickers.length > 0 ? (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="tetrone-table-col-img">{t('stickers.table_sticker')}</th>
                                    <th>{t('stickers.table_shortcode')}</th>
                                    <th className="tetrone-table-col-actions">{t('stickers.table_actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stickers.map(sticker => (
                                    <tr key={sticker.id}>
                                        <td>
                                            <img src={sticker.url} alt={sticker.shortcode} className="tetrone-table-img-preview" />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="tetrone-form-input"
                                                defaultValue={sticker.shortcode}
                                                onBlur={(e) => {
                                                    if (e.target.value !== sticker.shortcode) {
                                                        handleShortcodeChange(sticker.id, e.target.value);
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="tetrone-table-actions-center">
                                            <button
                                                className="tetrone-action-icon"
                                                onClick={() => handleStickerDelete(sticker.id)}
                                                title={t('common.delete')}
                                            >
                                                ✖
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="tetrone-empty-state">
                            <p>{t('stickers.no_stickers_yet')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}