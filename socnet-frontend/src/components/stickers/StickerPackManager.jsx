import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import StickerService from '../../services/sticker.service';
import { notifyError, notifySuccess } from '../common/Notify';
import StickerEditorModal from './StickerEditorModal';
import GlobalModal from '../common/GlobalModal';

export default function StickerPackManager({ existingPack = null, onSuccess, onCancel, onRefresh }) {
    const { t } = useTranslation();

    const [packId, setPackId] = useState(existingPack?.id || null);
    const [title, setTitle] = useState(existingPack?.title || '');
    const [isPublished, setIsPublished] = useState(existingPack?.is_published || false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(existingPack?.cover_url || null);

    const [localStickers, setLocalStickers] = useState(existingPack?.stickers || []);
    const [deletedStickerIds, setDeletedStickerIds] = useState([]);

    const [initialState, setInitialState] = useState({
        title: existingPack?.title || '',
        isPublished: existingPack?.is_published || false,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [editorModal, setEditorModal] = useState({ isOpen: false, sticker: null });
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, type: null });

    const [stickersChanged, setStickersChanged] = useState(false);
    const fileInputRef = useRef(null);

    const hasChanges =
        title !== initialState.title ||
        isPublished !== initialState.isPublished ||
        coverFile !== null ||
        stickersChanged ||
        deletedStickerIds.length > 0;

    const handleCloseAttempt = () => {
        if (hasChanges) {
            setConfirmConfig({ isOpen: true, type: 'close' });
        } else {
            onCancel();
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSavePack = async () => {
        if (!title.trim()) return notifyError(t('stickers.err_empty_title'));

        setIsSaving(true);
        try {
            const packData = { title, is_published: isPublished, cover: coverFile };
            let currentPackId = packId;

            if (currentPackId) {
                await StickerService.updatePack(currentPackId, packData);
            } else {
                if (!coverFile) {
                    setIsSaving(false);
                    return notifyError(t('stickers.err_no_cover'));
                }
                const response = await StickerService.createPack(packData);
                currentPackId = response.data.id;
                setPackId(currentPackId);
            }

            for (const id of deletedStickerIds) {
                if (typeof id !== 'string' && typeof id !== 'number') continue;
                await StickerService.deleteSticker(id);
            }

            for (const sticker of localStickers) {
                if (sticker.isNew && sticker.file) {
                    await StickerService.addSticker(currentPackId, {
                        file: sticker.file,
                        shortcode: sticker.shortcode,
                        keywords: sticker.keywords
                    });
                } else if (!sticker.isNew && existingPack) {
                    const original = existingPack.stickers.find(s => s.id === sticker.id);
                    const hasStickerChanged = original && (original.shortcode !== sticker.shortcode || original.keywords !== sticker.keywords || sticker.file);

                    if (hasStickerChanged) {
                        await StickerService.updateSticker(sticker.id, {
                            file: sticker.file,
                            shortcode: sticker.shortcode,
                            keywords: sticker.keywords
                        });
                    }
                }
            }

            setInitialState({ title, isPublished });
            setCoverFile(null);
            setStickersChanged(false);
            setDeletedStickerIds([]);

            notifySuccess(t('common.saved'));
            if (onSuccess) onSuccess();
            if (onRefresh) onRefresh();
        } catch (error) {
            notifyError(error.message || t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    const executeDeletePack = async () => {
        try {
            await StickerService.deletePack(packId);
            notifySuccess(t('stickers.deleted'));
            if (onSuccess) onSuccess();
            if (onRefresh) onRefresh();
        } catch (error) {
            notifyError(error.message);
        }
    };

    const handleStickerSavedLocal = (stickerData) => {
        setStickersChanged(true);
        setLocalStickers(prev => {
            const exists = prev.find(s => s.id === stickerData.id);
            if (exists) return prev.map(s => s.id === stickerData.id ? stickerData : s);
            return [...prev, stickerData];
        });
    };

    const handleStickerDeleteLocal = (id) => {
        setStickersChanged(true);
        setLocalStickers(prev => prev.filter(s => s.id !== id));
        if (existingPack?.stickers?.find(s => s.id === id)) {
            setDeletedStickerIds(prev => [...prev, id]);
        }
    };

    const handleConfirmResolve = (result) => {
        if (result && confirmConfig.type === 'close') {
            onCancel();
        } else if (result && confirmConfig.type === 'deletePack') {
            executeDeletePack();
        }
        setConfirmConfig({ isOpen: false, type: null });
    };

    return (
        <div className="tetrone-pack-manager">
            <div className="tetrone-pack-manager-scrollable">
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

                        <label className="tetrone-checkbox-label tetrone-mt-10">
                            <input
                                type="checkbox"
                                className="tetrone-checkbox"
                                checked={isPublished}
                                onChange={e => setIsPublished(e.target.checked)}
                            />
                            {t('stickers.publish_in_catalog')}
                        </label>
                    </div>

                    <div className="tetrone-setup-preview-col tetrone-setup-preview-center">
                        <div className="tetrone-preview-label">{t('stickers.cover')}</div>
                        <div
                            className="tetrone-pack-cover-img-preview tetrone-pointer"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {coverPreview ? <img src={coverPreview} alt="Cover" /> : <div className="tetrone-pack-cover-placeholder">+</div>}
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
                            <span>{t('stickers.stickers_list')} ({localStickers.length})</span>
                        </div>

                        <div className="tetrone-sticker-grid-scroll tetrone-packs-grid">
                            <div
                                className="tetrone-grid-item tetrone-create-pack-card tetrone-pointer"
                                onClick={() => setEditorModal({ isOpen: true, sticker: null })}
                            >
                                <div className="tetrone-create-pack-icon">+</div>
                                <div className="tetrone-create-pack-text">{t('stickers.add_sticker')}</div>
                            </div>

                            {localStickers.map(sticker => (
                                <div
                                    key={sticker.id}
                                    className="tetrone-grid-item tetrone-pointer"
                                    onClick={() => setEditorModal({ isOpen: true, sticker: sticker })}
                                    title={`:${sticker.shortcode}:`}
                                >
                                    <img src={sticker.url} alt={sticker.shortcode} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="tetrone-modal-footer vk-gray">
                <div>
                    {packId && (
                        <button
                            className="tetrone-btn tetrone-btn-cancel tetrone-text-error"
                            onClick={() => setConfirmConfig({ isOpen: true, type: 'deletePack' })}
                        >
                            {t('stickers.delete_pack')}
                        </button>
                    )}
                </div>
                <div className="tetrone-modal-footer-right">
                    <button className="tetrone-btn tetrone-btn-cancel" onClick={handleCloseAttempt}>
                        {t('common.cancel')}
                    </button>
                    <button className="tetrone-btn" onClick={handleSavePack} disabled={isSaving || !hasChanges}>
                        {isSaving ? t('common.loading') : t('common.save')}
                    </button>
                </div>
            </div>

            {editorModal.isOpen && (
                <StickerEditorModal
                    stickerToEdit={editorModal.sticker}
                    onClose={() => setEditorModal({ isOpen: false, sticker: null })}
                    onSuccess={handleStickerSavedLocal}
                    onDelete={handleStickerDeleteLocal}
                />
            )}

            <GlobalModal
                isOpen={confirmConfig.isOpen}
                type="confirm"
                message={confirmConfig.type === 'close' ? t('stickers.unsaved_changes_confirm') : t('stickers.confirm_delete_pack')}
                btnSubmit={t('common.yes')}
                btnCancel={t('common.no')}
                onClose={() => setConfirmConfig({ isOpen: false, type: null })}
                onResolve={handleConfirmResolve}
            />
        </div>
    );
}