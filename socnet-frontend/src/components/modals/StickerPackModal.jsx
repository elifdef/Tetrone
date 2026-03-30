import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError, notifySuccess } from '../common/Notify';
import StickerService from '../../services/sticker.service';
import { DotsIcon, ReportIcon } from '../ui/Icons';

export default function StickerPackModal({ pack, onClose, onRefresh }) {
    const { t } = useTranslation();
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInstalled, setIsInstalled] = useState(pack.is_installed);
    const [isProcessing, setIsProcessing] = useState(false);

    const detailRef = useRef(null);
    const menuRef = useRef(null);

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
        if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
            setIsMenuOpen(false);
        }
    };

    const handleToggleInstall = async () => {
        setIsProcessing(true);
        try {
            if (isInstalled) {
                await StickerService.uninstallPack(pack.short_name);
                setIsInstalled(false);
                notifySuccess(t('stickers.pack_uninstalled'));
            } else {
                await StickerService.installPack(pack.short_name);
                setIsInstalled(true);
                notifySuccess(t('stickers.pack_installed'));
            }
            if (onRefresh) onRefresh();
        } catch (error) {
            notifyError(error.message || t('common.error'));
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleFavorite = (sticker) => {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        let favs = saved ? JSON.parse(saved) : [];

        if (favs.find(f => f.id === sticker.id)) {
            favs = favs.filter(f => f.id !== sticker.id);
            notifySuccess(t('stickers.removed_from_favorites'));
        } else {
            favs.unshift(sticker);
            notifySuccess(t('stickers.saved_to_favorites'));
        }

        localStorage.setItem('tetrone_favorite_emojis', JSON.stringify(favs));
    };

    return (
        <div className="tetrone-modal-overlay" onClick={handleOverlayClick}>
            <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>

                <div className="tetrone-modal-header">
                    <h3>{t('stickers.view_pack')}</h3>

                    <div className="tetrone-modal-header-actions">
                        <div className="tetrone-post-actions-container" ref={menuRef}>
                            <button
                                className="tetrone-modal-close"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <DotsIcon width={16} height={16} />
                            </button>

                            {isMenuOpen && (
                                <div className="tetrone-actions-dropdown">
                                    <button className="warning" onClick={() => { setIsMenuOpen(false); notifySuccess(t('api.success.PACK_REPORTED')); }}>
                                        <ReportIcon /> {t('reports.title')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <button className="tetrone-modal-close" onClick={onClose} title={t('common.close')}>✖</button>
                    </div>
                </div>

                <div className="tetrone-modal-body">
                    <div className="tetrone-pack-info-block">
                        <img src={pack.cover_url} className="tetrone-pack-cover-img" alt="" />
                        <div className="tetrone-pack-text-info">
                            <span className="tetrone-pack-title-label">{pack.title}</span>
                            <span className="tetrone-pack-meta-label">{t('stickers.by_author')} {pack.author}</span>
                            <span className="tetrone-pack-meta-label">{pack.stickers_count} / 120 {t('stickers.stickers_count')}</span>
                        </div>
                    </div>

                    {pack.stickers?.length > 0 ? (
                        <div className="tetrone-sticker-grid-scroll">
                            {pack.stickers.map(sticker => (
                                <div
                                    key={sticker.id}
                                    className="tetrone-grid-item tetrone-pointer"
                                    onClick={() => setSelectedSticker(sticker)}
                                >
                                    <img src={sticker.url} alt={sticker.shortcode} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="tetrone-empty-state">
                            <p>{t('stickers.no_stickers_yet')}</p>
                        </div>
                    )}

                    {selectedSticker && (
                        <div className="tetrone-sticker-detail-popover" ref={detailRef}>
                            <div className="tetrone-modal-header">
                                <h3>{t('stickers.info_title')}</h3>
                                <button className="tetrone-modal-close" onClick={() => setSelectedSticker(null)}>✖</button>
                            </div>
                            <div className="tetrone-detail-content">
                                <img src={selectedSticker.url} className="tetrone-detail-big-img" alt="" />
                                <div className="tetrone-detail-row">
                                    <span className="tetrone-detail-label">{t('stickers.code_to_type')}:</span>
                                    <span className="tetrone-detail-value">:{selectedSticker.shortcode}:</span>
                                </div>
                                {selectedSticker.keywords && (
                                    <div className="tetrone-detail-row">
                                        <span className="tetrone-detail-label">{t('stickers.tags')}:</span>
                                        <span className="tetrone-detail-value">{selectedSticker.keywords}</span>
                                    </div>
                                )}
                            </div>
                            <div className="tetrone-modal-footer">
                                <button
                                    className="tetrone-btn tetrone-btn-small tetrone-btn-full-width"
                                    onClick={() => toggleFavorite(selectedSticker)}
                                >
                                    ⭐ {t('stickers.save_to_favorites')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="tetrone-modal-footer">
                    <button className="tetrone-btn-ghost" onClick={onClose}>
                        {t('common.close')}
                    </button>
                    <button
                        className={`tetrone-btn ${isInstalled ? 'tetrone-btn-cancel' : ''}`}
                        onClick={handleToggleInstall}
                        disabled={isProcessing}
                    >
                        {isProcessing
                            ? t('common.loading')
                            : isInstalled
                                ? t('stickers.remove_pack')
                                : t('stickers.add_pack')
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}