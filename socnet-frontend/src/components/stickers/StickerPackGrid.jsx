import React from 'react';
import { useTranslation } from 'react-i18next';

export default function StickerPackGrid({ stickers, onAddClick, onStickerClick }) {
    const { t } = useTranslation();

    return (
        <div className="tetrone-pack-items-manager">
            <div className="tetrone-section-title tetrone-section-title-spaced">
                <span>{t('stickers.stickers_list')} ({stickers.length})</span>
            </div>

            <div className="tetrone-sticker-grid-scroll tetrone-packs-grid">
                <div
                    className="tetrone-grid-item tetrone-create-pack-card tetrone-pointer"
                    onClick={onAddClick}
                >
                    <div className="tetrone-create-pack-icon">+</div>
                    <div className="tetrone-create-pack-text">{t('stickers.add_sticker')}</div>
                </div>

                {stickers.map(sticker => (
                    <div
                        key={sticker.id}
                        className="tetrone-grid-item tetrone-pointer"
                        onClick={() => onStickerClick(sticker)}
                        title={`:${sticker.shortcode}:`}
                    >
                        <img src={sticker.url} alt={sticker.shortcode} />
                    </div>
                ))}
            </div>
        </div>
    );
}