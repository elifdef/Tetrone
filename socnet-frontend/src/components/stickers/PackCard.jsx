import { useTranslation } from 'react-i18next';

export default function PackCard({ pack, onClick }) {
    const { t } = useTranslation();

    return (
        <div className="tetrone-pack-card clickable" onClick={() => onClick(pack)}>
            <img src={pack.cover_url} alt={pack.title} className="tetrone-pack-cover" />
            <div className="tetrone-pack-title">{pack.title}</div>
            <div className="tetrone-pack-status">
                {pack.stickers_count} {t('stickers.stickers_count')}
            </div>
        </div>
    );
}