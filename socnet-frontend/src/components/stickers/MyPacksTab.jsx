import { useTranslation } from 'react-i18next';
import PackCard from './PackCard';

export default function MyPacksTab({ packs, isLoading, onSelectPack }) {
    const { t } = useTranslation();

    if (isLoading) {
        return <div className="tetrone-loader-full">{t('common.loading')}</div>;
    }

    if (packs.length === 0) {
        return (
            <div className="tetrone-empty-state tetrone-empty-state-full">
                <h3>{t('stickers.empty_my_packs_title')}</h3>
                <p>{t('stickers.empty_my_packs_desc')}</p>
            </div>
        );
    }

    return (
        <div className="tetrone-pack-grid">
            {packs.map(pack => (
                <PackCard key={pack.id} pack={pack} onClick={onSelectPack} />
            ))}
        </div>
    );
}