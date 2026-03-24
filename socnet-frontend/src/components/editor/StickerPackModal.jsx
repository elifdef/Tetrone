import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError, notifySuccess } from '../common/Notify';
import StickerService from '../../services/sticker.service';

export default function StickerPackModal({ pack, onClose, onRefresh }) {
    const { t } = useTranslation();
    const [selectedSticker, setSelectedSticker] = useState(null);
    const detailRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (selectedSticker) setSelectedSticker(null);
                else onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSticker, onClose]);

    const handleOverlayClick = (e) => {
        if (selectedSticker && detailRef.current && !detailRef.current.contains(e.target)) {
            setSelectedSticker(null);
        }
    };

    const handleInstall = async () => {
        try {
            const response = await StickerService.installPack(pack.id);
            if (response.success) {
                notifySuccess(t(`api.${response.code}`));
                if (onRefresh) onRefresh();
                onClose();
            }
        } catch (error) {
            notifyError(error.message || t('common.error'));
        }
    };

    const toggleFavorite = (sticker) => {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        let favs = saved ? JSON.parse(saved) : [];

        if (favs.find(f => f.id === sticker.id)) {
            favs = favs.filter(f => f.id !== sticker.id);
            notifySuccess('Видалено з обраних');
        } else {
            favs.unshift(sticker);
            notifySuccess('Збережено в обрані');
        }

        localStorage.setItem('tetrone_favorite_emojis', JSON.stringify(favs));
    };

    return (
        <div className="tetrone-modal-overlay" onClick={handleOverlayClick}>
            <div className="tetrone-modal-content vk-style" onClick={e => e.stopPropagation()}>

                <div className="tetrone-modal-header vk-blue">
                    <h3>{t('stickers.view_pack')}</h3>
                    <div className="vk-close-btn" onClick={onClose}>&times;</div>
                </div>

                <div className="tetrone-modal-body tetrone-pack-body">
                    <div className="tetrone-pack-info-block">
                        <img src={pack.cover_url} className="tetrone-pack-cover-img" alt="" />
                        <div className="tetrone-pack-text-info">
                            <span className="tetrone-pack-title-label">{pack.title}</span>
                            <span className="tetrone-pack-meta-label">{t('stickers.by_author')} {pack.author}</span>
                            <span className="tetrone-pack-meta-label">{pack.stickers_count} {t('stickers.stickers_count')}</span>
                        </div>
                    </div>

                    <div className="tetrone-sticker-grid-scroll">
                        {pack.stickers?.map(sticker => (
                            <div
                                key={sticker.id}
                                className="tetrone-grid-item"
                                onClick={() => setSelectedSticker(sticker)}
                            >
                                <img src={sticker.url} alt={sticker.shortcode} />
                            </div>
                        ))}
                    </div>

                    {selectedSticker && (
                        <div className="tetrone-sticker-detail-popover" ref={detailRef}>
                            <div className="tetrone-modal-header vk-blue">
                                <h3>Інформація</h3>
                                <div className="vk-close-btn" onClick={() => setSelectedSticker(null)}>&times;</div>
                            </div>
                            <div className="tetrone-detail-content">
                                <img src={selectedSticker.url} className="tetrone-detail-big-img" alt="" />
                                <div className="tetrone-detail-row">
                                    <span className="tetrone-detail-label">Код для вводу:</span>
                                    <span className="tetrone-detail-value">:{selectedSticker.shortcode}:</span>
                                </div>
                                {selectedSticker.keywords && (
                                    <div className="tetrone-detail-row">
                                        <span className="tetrone-detail-label">Теги:</span>
                                        <span className="tetrone-detail-value">{selectedSticker.keywords}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                className="tetrone-btn tetrone-btn-small tetrone-btn-full-width"
                                style={{ marginTop: '10px' }}
                                onClick={() => toggleFavorite(selectedSticker)}
                            >
                                ⭐ {t('stickers.save_to_favorites')}
                            </button>
                        </div>
                    )}
                </div>

                <div className="tetrone-modal-footer vk-gray">
                    <button className="tetrone-btn tetrone-btn-ghost" onClick={() => notifySuccess('Reported')}>
                        {t('reports.title')}
                    </button>
                    <button className="tetrone-btn" onClick={handleInstall}>
                        {t('stickers.add_pack')}
                    </button>
                </div>
            </div>
        </div>
    );
}