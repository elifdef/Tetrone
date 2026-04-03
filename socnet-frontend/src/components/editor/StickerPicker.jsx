import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import StickerService from '../../services/sticker.service';

export default function StickerPicker({ onSelect }) {
    const { t } = useTranslation();
    const [packs, setPacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('favorites');
    const [searchQuery, setSearchQuery] = useState('');

    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        const fetchPacks = async () => {
            try {
                const response = await StickerService.getMyPacks();
                setPacks(response.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPacks();
    }, []);

    const displayStickers = useMemo(() => {
        if (activeTab === 'favorites') {
            return favorites;
        }

        const selectedPack = packs.find(p => p.id === activeTab);
        let stickers = selectedPack?.stickers || [];

        let formattedStickers = stickers.map(s => ({
            ...s,
            pack_short_name: selectedPack?.short_name || selectedPack?.id
        }));

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return formattedStickers.filter(e =>
                e.shortcode.toLowerCase().includes(query) ||
                (e.keywords && e.keywords.toLowerCase().includes(query))
            );
        }
        return formattedStickers;
    }, [packs, activeTab, searchQuery, favorites]);

    return (
        <div className="tetrone-sticker-picker" onClick={(e) => e.stopPropagation()}>
            <div className="tetrone-sticker-picker-header">
                <button
                    type="button"
                    className={`tetrone-sticker-picker-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('favorites')}
                    title={t('stickers.tab_favorites')}
                >
                    ⭐
                </button>

                {packs.map(pack => (
                    <button
                        key={pack.id}
                        type="button"
                        className={`tetrone-sticker-picker-tab ${activeTab === pack.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(pack.id)}
                        title={pack.title}
                    >
                        <img src={pack.cover_url} alt="" />
                    </button>
                ))}
            </div>

            {activeTab !== 'favorites' && (
                <div className="tetrone-sticker-picker-search">
                    <input
                        type="text"
                        className="tetrone-form-input"
                        placeholder={t('stickers.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            <div className="tetrone-sticker-picker-content">
                {isLoading ? (
                    <div className="tetrone-sticker-picker-empty">
                        {t('common.loading')}
                    </div>
                ) : displayStickers.length > 0 ? (
                    <>
                        {activeTab === 'favorites' && (
                            <div className="tetrone-sticker-picker-section-label">
                                {t('stickers.your_favorites')}
                            </div>
                        )}

                        <div className="tetrone-sticker-picker-grid">
                            {displayStickers.map(sticker => (
                                <button
                                    key={sticker.id}
                                    type="button"
                                    className="tetrone-sticker-btn"
                                    onClick={() => {
                                        onSelect({
                                            ...sticker,
                                            url: sticker.url || sticker.src
                                        });
                                    }}
                                    title={`:${sticker.shortcode}:`}
                                >
                                    <img src={sticker.url || sticker.src} alt={sticker.shortcode} />
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="tetrone-sticker-picker-empty">
                        {activeTab === 'favorites'
                            ? t('stickers.no_favorites')
                            : t('stickers.not_found')}
                    </div>
                )}
            </div>
        </div>
    );
}