import React, { useState, useRef, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { notifyError } from '../common/Notify';
import { ImageIcon } from '../ui/Icons';
import PostItem from '../post/PostItem';
import Button from '../ui/Button';

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

    const tagsArray = keywords.split(',').filter(k => k.trim() !== '');
    const isKeywordsValid = tagsArray.length <= 5;
    const isShortcodeValid = shortcode.trim().length >= 2 && shortcode.trim().length <= 30 && /^[a-zA-Z0-9_]+$/.test(shortcode.trim());
    const isFormValid = preview !== null && isShortcodeValid && isKeywordsValid;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));

            if (!shortcode && !isEditMode) {
                const defaultName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, '');
                setShortcode(defaultName || 'sticker');
                if (defaultName) setKeywords(defaultName);
            }
        }
    };

    const handleSave = () => {
        if (!isFormValid) return notifyError(t('common.error'));

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
                    attrs: { id: stickerToEdit?.id, shortcode: shortcode || 'demo_code', src: preview }
                }]
            }]
        },
        user: user,
        created_at: new Date().toISOString(),
        likes_count: 0, comments_count: 0, reposts_count: 0,
        is_liked: false, is_repost: false, original_post_id: null
    }), [preview, stickerToEdit?.id, shortcode, user]);

    const fakePostSmall = useMemo(() => ({
        id: -1,
        content: {
            type: 'doc',
            content: [{
                type: 'paragraph',
                content: [
                    { type: 'text', text: t(`stickers.preview_text_${Math.floor(Math.random() * 8 + 1)}`) },
                    { type: 'customSticker', attrs: { id: stickerToEdit?.id, shortcode: shortcode || 'demo_code', src: preview } }
                ]
            }]
        },
        user: user,
        created_at: new Date().toISOString(),
        likes_count: 0, comments_count: 0, reposts_count: 0,
        is_liked: false, is_repost: false, original_post_id: null
    }), [preview, stickerToEdit?.id, shortcode, user, t]);

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
                                    accept="image/png, image/webp"
                                    className="tetrone-hidden"
                                />
                            </div>

                            <div className="tetrone-form-group">
                                <label className="tetrone-form-label">{t('stickers.table_shortcode')}</label>
                                <input
                                    type="text"
                                    className={`tetrone-form-input ${!isShortcodeValid && shortcode.length > 0 ? 'tetrone-input-error' : ''}`}
                                    value={shortcode}
                                    onChange={e => setShortcode(e.target.value)}
                                    placeholder={t('stickers.placeholder_shortcode')}
                                />
                                {!isShortcodeValid && shortcode.length > 0 && (
                                    <span className="tetrone-text-error tetrone-text-small">
                                        {t('stickers.err_shortcode_format')}
                                    </span>
                                )}
                            </div>

                            <div className="tetrone-form-group">
                                <label className="tetrone-form-label">{t('stickers.tags')}</label>
                                <input
                                    type="text"
                                    className={`tetrone-form-input ${!isKeywordsValid ? 'tetrone-input-error' : ''}`}
                                    value={keywords}
                                    onChange={e => setKeywords(e.target.value)}
                                    placeholder={t('stickers.placeholder_tags')}
                                />
                                {!isKeywordsValid && (
                                    <span className="tetrone-text-error tetrone-text-small">
                                        {t('stickers.err_tags_format')}
                                    </span>
                                )}
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
                            <Button variant="danger" onClick={handleDeleteClick}>
                                {t('common.delete')}
                            </Button>
                        )}
                    </div>

                    <div className="tetrone-modal-footer-right">
                        <Button variant="secondary" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={!isFormValid}>
                            {t('common.save')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}