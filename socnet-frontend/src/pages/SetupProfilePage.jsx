import { useTranslation } from 'react-i18next';
import { usePageTitle } from "../hooks/usePageTitle";
import ProfileSettings from "../components/settings/ProfileSettings";

export default function SetupProfilePage() {
    const { t } = useTranslation();
    usePageTitle(t('first_setup.title'));

    return (
        <div className="tetrone-setup-wrapper">
            <div className="tetrone-setup-header">
                <h1 className="tetrone-setup-title">{t('first_setup.title')}</h1>
                <p className="tetrone-setup-subtitle">{t('first_setup.fill_details')}</p>
            </div>
            <ProfileSettings isSetupMode={true} />
        </div>
    );
}