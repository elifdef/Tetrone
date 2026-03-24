import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import StickerService from '../services/sticker.service';
import { usePageTitle } from '../hooks/usePageTitle';
import { notifyError } from '../components/common/Notify';
import { useTranslation } from 'react-i18next';
import StickerPackModal from '../components/editor/StickerPackModal';

import CatalogTab from '../components/stickers/CatalogTab';
import MyPacksTab from '../components/stickers/MyPacksTab';
import StickerPackManager from '../components/stickers/StickerPackManager';

const StickerShopPage = () => {
    const { t } = useTranslation();
    usePageTitle(t('stickers.shop_title'));

    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'catalog';

    const [myPacks, setMyPacks] = useState([]);
    const [isLoadingMy, setIsLoadingMy] = useState(true);

    const [catalogPacks, setCatalogPacks] = useState([]);
    const [catalogPage, setCatalogPage] = useState(1);
    const [hasMoreCatalog, setHasMoreCatalog] = useState(true);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

    const [selectedPack, setSelectedPack] = useState(null);

    const fetchCatalog = useCallback(async (pageNumber) => {
        try {
            setIsLoadingCatalog(true);
            const response = await StickerService.getCatalog(pageNumber);
            if (response.success) {
                const newPacks = response.data || [];
                setCatalogPacks(prev => pageNumber === 1 ? newPacks : [...prev, ...newPacks]);
                setHasMoreCatalog(newPacks.length === 15);
                setCatalogPage(pageNumber);
            }
        } catch (error) {
            notifyError(t('error.connection'));
        } finally {
            setIsLoadingCatalog(false);
        }
    }, [t]);

    const fetchMyPacks = useCallback(async () => {
        try {
            setIsLoadingMy(true);
            const response = await StickerService.getMyPacks();
            if (response.success) {
                setMyPacks(response.data || []);
            }
        } catch (error) {
            // console.error("My Packs error:", error);
        } finally {
            setIsLoadingMy(false);
        }
    }, [t]);

    useEffect(() => {
        if (currentTab === 'my') {
            fetchMyPacks();
        } else if (currentTab === 'catalog') {
            if (catalogPacks.length === 0) fetchCatalog(1);
        }
    }, [currentTab, fetchMyPacks, fetchCatalog, catalogPacks.length]);

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    return (
        <>
            <div className="tetrone-card-wrapper">
                <h2 className="tetrone-section-title">{t('stickers.shop_title')}</h2>

                <div className="tetrone-tabs">
                    {['catalog', 'my', 'create'].map(tab => (
                        <button
                            key={tab}
                            className={`tetrone-tab ${currentTab === tab ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            {t(`stickers.tab_${tab}`)}
                        </button>
                    ))}
                </div>

                {currentTab === 'catalog' && (
                    <CatalogTab
                        packs={catalogPacks}
                        isLoading={isLoadingCatalog}
                        page={catalogPage}
                        hasMore={hasMoreCatalog}
                        onLoadMore={() => fetchCatalog(catalogPage + 1)}
                        onSelectPack={setSelectedPack}
                    />
                )}

                {currentTab === 'my' && (
                    <MyPacksTab
                        packs={myPacks}
                        isLoading={isLoadingMy}
                        onSelectPack={setSelectedPack}
                    />
                )}

                {currentTab === 'create' && (
                    <StickerPackManager
                        onSuccess={() => handleTabChange('my')}
                    />
                )}
            </div>

            {selectedPack && (
                <StickerPackModal
                    pack={selectedPack}
                    onClose={() => setSelectedPack(null)}
                    onRefresh={fetchMyPacks}
                />
            )}
        </>
    );
};

export default StickerShopPage;