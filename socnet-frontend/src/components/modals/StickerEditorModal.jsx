import React, { useState, useRef, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { notifyError } from '../common/Notify';
import { ImageIcon } from '../ui/Icons';
import PostItem from '../post/PostItem';

export default function StickerEditorModal({ stickerToEdit = null, onClose, onSuccess, onDelete }) {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { openConfirm } = useModal();

    const isEditMode = !!stickerToEdit;

    const [file, setFile] = useState(stickerToEdit?.file || null);
    const [preview, setPreview] = useState(stickerToEdit?.url || null);
    const [shortcode, setShortcode] = useState(stickerToEdit?.shortcode || '');
    const [keywords, setKeywords] = useState(stickerToEdit?.keywords || '');

    const fileInputRef = useRef(null);

    const isFormValid = preview !== null && shortcode.trim().length >= 2;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));

            if (!shortcode && !isEditMode) {
                const defaultName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, '');
                setShortcode(defaultName || 'sticker');
                setKeywords(defaultName || 'sticker');
            }
        }
    };

    const handleSave = () => {
        if (!isFormValid) return notifyError(t('stickers.err_no_file'));

        onSuccess({
            ...stickerToEdit,
            id: stickerToEdit?.id || Date.now(),
            file: file,
            url: preview,
            shortcode: shortcode.trim(),
            keywords: keywords.trim(),
            isNew: !isEditMode
        });

        onClose();
    };

    const handleDeleteClick = async () => {
        const isConfirmed = await openConfirm(t('common.are_u_sure'), t('common.confirm'));
        if (isConfirmed && onDelete) {
            onDelete(stickerToEdit.id);
            onClose();
        }
    };

    const fakePostBig = useMemo(() => ({
        id: -1,
        content: {
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [{
                    type: 'customSticker',
                    attrs: {
                        id: stickerToEdit?.id,
                        shortcode: 'demo_code',
                        src: preview
                    }
                }]
            }]
        },
        user: user,
        created_at: new Date().toISOString(),
        likes_count: 0, comments_count: 0, reposts_count: 0,
        is_liked: false, is_repost: false, original_post_id: null
    }), [preview, stickerToEdit?.id, user]);

    const fakePostSmall = useMemo(() => ({
        id: -1,
        content: {
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [
                    { type: 'text', text: t(`stickers.preview_text_${Math.floor(Math.random() * 8 + 1)}`) },
                    { type: 'customSticker', attrs: { id: stickerToEdit?.id, shortcode: 'demo_code', src: preview } }
                ]
            }]
        },
        user: user,
        created_at: new Date().toISOString(),
        likes_count: 0, comments_count: 0, reposts_count: 0,
        is_liked: false, is_repost: false, original_post_id: null
    }), [preview, stickerToEdit?.id, user, t]);

    const previewPostsJSX = useMemo(() => (
        <div className="tetrone-sticker-preview-posts">
            <PostItem post={fakePostBig} isOwner={false} currentUserId={user?.id} readonly={true} isInner={true} />
            <PostItem post={fakePostSmall} isOwner={false} currentUserId={user?.id} readonly={true} isInner={true} />
        </div>
    ), [fakePostBig, fakePostSmall, user?.id]);

    return (
        <div className="tetrone-modal-overlay" onClick={onClose}>
            <div className="tetrone-modal-dialog modal-lg" onClick={e => e.stopPropagation()}>

                <div className="tetrone-modal-header">
                    <h3>{isEditMode ? t('stickers.edit_sticker') : t('stickers.add_sticker')}</h3>
                    <button className="tetrone-modal-close" onClick={onClose}>✖</button>
                </div>

                <div className="tetrone-modal-body">
                    <div className="tetrone-sticker-editor-layout">
                        <div className="tetrone-sticker-editor-form">
                            <div className="tetrone-form-group tetrone-text-center">
                                <div
                                    className="tetrone-sticker-upload-preview tetrone-pointer"
                                    onClick={() => fileInputRef.current.click()}
                                    title={t('stickers.click_to_upload')}
                                >
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="tetrone-img-cover" />
                                    ) : (
                                        <div className="tetrone-upload-placeholder">
                                            <ImageIcon width={32} height={32} />
                                            <span>{t('stickers.click_to_upload')}</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/png, image/webp, image/gif"
                                    className="tetrone-hidden"
                                />
                            </div>

                            <div className="tetrone-form-group">
                                <label className="tetrone-form-label">{t('stickers.table_shortcode')}</label>
                                <input
                                    type="text"
                                    className="tetrone-form-input"
                                    value={shortcode}
                                    onChange={e => setShortcode(e.target.value)}
                                    placeholder={t('stickers.placeholder_shortcode')}
                                />
                            </div>

                            <div className="tetrone-form-group">
                                <label className="tetrone-form-label">{t('stickers.tags')}</label>
                                <input
                                    type="text"
                                    className="tetrone-form-input"
                                    value={keywords}
                                    onChange={e => setKeywords(e.target.value)}
                                    placeholder={t('stickers.placeholder_tags')}
                                />
                            </div>
                        </div>

                        <div className="tetrone-sticker-editor-preview">
                            <div className="tetrone-preview-label">{t('stickers.preview_label')}</div>
                            {preview ? previewPostsJSX : (
                                <div className="tetrone-empty-state">
                                    <p>{t('stickers.err_no_file')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="tetrone-modal-footer tetrone-flex-between">
                    <div>
                        {isEditMode && (
                            <button
                                className="tetrone-btn tetrone-btn-cancel tetrone-text-error"
                                onClick={handleDeleteClick}
                            >
                                {t('common.delete')}
                            </button>
                        )}
                    </div>

                    <div className="tetrone-modal-footer-right">
                        <button className="tetrone-btn tetrone-btn-cancel" onClick={onClose}>
                            {t('common.cancel')}
                        </button>
                        <button className="tetrone-btn" onClick={handleSave} disabled={!isFormValid}>
                            {t('common.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}