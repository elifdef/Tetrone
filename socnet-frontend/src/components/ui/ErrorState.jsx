import { useTranslation } from 'react-i18next';

export default function ErrorState({ title, description, onRetry }) {
    const { t } = useTranslation();

    const handleRetry = onRetry || (() => window.location.reload());

    return (
        <div className="tetrone-empty-state with-card">
            <h3>{title || t('error.connection')}</h3>
            <p>{description || t('error.loading', { resource: t('common.profile') })}</p>

            <div className="tetrone-feed-actions">
                <button
                    className="tetrone-btn-small"
                    onClick={handleRetry}
                >
                    {t('common.reload_page')}
                </button>
            </div>
        </div>
    );
}