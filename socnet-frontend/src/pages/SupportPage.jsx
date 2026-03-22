import { useTranslation } from 'react-i18next';
import { usePageTitle } from "../hooks/usePageTitle";

const SupportPage = () => {
    const { t } = useTranslation();
    usePageTitle(t('common.support_panel'));

    return (
        <div className="tetrone-card-wrapper">
            <h2 className="tetrone-section-title">{t('common.support_panel')}</h2>
            <div className="tetrone-empty-state with-card">
                (У розробці)
                <div>
                    Підтримайте себе самі
                </div>
            </div>
        </div>
    );
};

export default SupportPage;