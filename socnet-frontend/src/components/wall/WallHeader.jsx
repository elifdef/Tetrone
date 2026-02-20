import { useTranslation } from 'react-i18next';

export default function WallHeader({ postsCount }) {
    const { t } = useTranslation();

    return (
        <div className="socnet-wall-header">
            <span className="socnet-wall-title">{t('wall.title')}</span>
            <span className="socnet-wall-count">
                {t('wall.posts_count', { count: postsCount })}
            </span>
        </div>
    );
}