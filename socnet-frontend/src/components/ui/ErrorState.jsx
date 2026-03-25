import { useTranslation } from 'react-i18next';

export default function ErrorState({ title, description, onRetry, buttonText, showButton = true }) {
    const { t } = useTranslation();

    const handleRetry = onRetry || (() => window.location.reload());

    return (
        <div className="tetrone-empty-state with-card">
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}

            {showButton && (
                <div className="tetrone-feed-actions tetrone-mt-10">
                    <button
                        className="tetrone-btn tetrone-btn-small"
                        onClick={handleRetry}
                    >
                        {buttonText || t('common.reload_page')}
                    </button>
                </div>
            )}
        </div>
    );
}