import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function StickerPackSettings({
    title, setTitle,
    isPublished, setIsPublished,
    coverPreview, onCoverChange
}) {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onCoverChange(file);
        }
    };

    return (
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
                    {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="tetrone-img-cover" />
                    ) : (
                        <div className="tetrone-pack-cover-placeholder">+</div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="tetrone-hidden"
                />
            </div>
        </div>
    );
}