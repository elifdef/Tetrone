import { useTranslation } from 'react-i18next';

export default function WallHeader({ postsCount }) {
    const { t } = useTranslation();

    return (
        <div className="tetrone-wall-header">
            <span className="tetrone-wall-title">{t('wall.title')}</span>
            <span className="tetrone-wall-count">
                {t('entities.post', { count: postsCount })}
            </span>
        </div>
    );
}