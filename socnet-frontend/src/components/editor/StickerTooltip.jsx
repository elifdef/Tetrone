import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import StickerService from '../../services/sticker.service';

// щоб не довбати сервер до долбаного отказа своїми стікерами
const stickerInfoCache = {};

export default function StickerTooltip({ shortcode, position, onMouseLeave }) {
    const { t } = useTranslation();
    const [info, setInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchInfo = async () => {
            if (stickerInfoCache[shortcode]) {
                setInfo(stickerInfoCache[shortcode]);
                setIsLoading(false);
                return;
            }

            try {
                const response = await StickerService.getStickerInfo(shortcode);
                if (isMounted && response.success) {
                    stickerInfoCache[shortcode] = response.data;
                    setInfo(response.data);
                }
            } catch (error) {
                // error handling
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (shortcode) fetchInfo();

        return () => { isMounted = false; };
    }, [shortcode]);

    const handleInstall = async () => {
        if (!info?.pack?.short_name) return;
        try {
            const response = await StickerService.installPack(info.pack.short_name);
            if (response.success) {
                const updatedInfo = {
                    ...info,
                    pack: { ...info.pack, is_installed: true }
                };
                stickerInfoCache[shortcode] = updatedInfo;
                setInfo(updatedInfo);
            }
        } catch (error) {
            // error handling
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
                                {t('stickers.by_author')} {info.pack.author?.name || info.pack.author}
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
                        {info.pack.is_deleted ? (
                            <span className="tetrone-text-muted tetrone-sticker-tooltip-deleted-text">
                                {t('stickers.pack_deleted')}
                            </span>
                        ) : (
                            <>
                                <Link
                                    to={`/stickers-shop?tab=catalog&search=${info.pack.short_name}`}
                                    className="tetrone-btn  tetrone-btn-ghost tetrone-btn-full-width"
                                >
                                    {t('stickers.view_pack')}
                                </Link>

                                {!info.pack.is_installed && (
                                    <button
                                        className="tetrone-btn  tetrone-btn-full-width tetrone-mt-4"
                                        onClick={handleInstall}
                                    >
                                        {t('stickers.add_pack')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}