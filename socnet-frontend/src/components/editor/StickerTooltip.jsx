import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import StickerService from '../../services/sticker.service';

export default function StickerTooltip({ emojiId, position, onMouseLeave }) {
    const { t } = useTranslation();
    const [info, setInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchInfo = async () => {
            try {
                const response = await StickerService.getStickerInfo(emojiId);
                if (isMounted && response.success) {
                    setInfo(response.data);
                }
            } catch (error) {
                // console.error("Failed to load sticker info");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (emojiId) fetchInfo();
        return () => { isMounted = false; };
    }, [emojiId]);

    const handleInstall = async () => {
        if (!info?.pack?.id) return;
        try {
            const response = await StickerService.installPack(info.pack.id);
            if (response.success) {
                setInfo(prev => ({
                    ...prev,
                    pack: { ...prev.pack, is_installed: true }
                }));
            }
        } catch (error) {
            // console.error("Failed to install pack");
        }
    };

    return (
        <div
            className="tetrone-sticker-hover-tooltip"
            style={{ top: position.y, left: position.x }}
            onMouseLeave={onMouseLeave}
        >
            {isLoading ? (
                <div className="tetrone-sticker-tooltip-loader">{t('common.loading')}</div>
            ) : info ? (
                <>
                    <div className="tetrone-sticker-tooltip-header">
                        <div className="tetrone-sticker-tooltip-pack-info">
                            <span className="tetrone-sticker-tooltip-title">{info.pack.title}</span>
                            <span className="tetrone-sticker-tooltip-author">
                                {t('stickers.by_author')} {info.pack.author}
                            </span>
                        </div>
                    </div>

                    <div className="tetrone-sticker-tooltip-samples">
                        {info.samples && info.samples.map(sample => (
                            <img
                                key={sample.id}
                                src={sample.url}
                                alt={sample.shortcode}
                                className="tetrone-sticker-tooltip-sample-img"
                            />
                        ))}
                    </div>

                    <div className="tetrone-sticker-tooltip-actions">
                        <Link
                            to={`/stickers-shop?tab=catalog&search=${info.pack.id}`}
                            className="tetrone-btn tetrone-btn-small tetrone-btn-ghost tetrone-btn-full-width"
                        >
                            {t('stickers.view_pack')}
                        </Link>

                        {!info.pack.is_installed && (
                            <button
                                className="tetrone-btn tetrone-btn-small tetrone-btn-full-width"
                                onClick={handleInstall}
                                style={{ marginTop: '4px' }}
                            >
                                {t('stickers.add_pack')}
                            </button>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}