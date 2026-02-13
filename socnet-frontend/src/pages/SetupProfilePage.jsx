import { useTranslation } from 'react-i18next';
import { usePageTitle } from "../hooks/usePageTitle";
import ProfileSettings from "../components/settings/ProfileSettings";

export default function SetupProfilePage() {
    const { t } = useTranslation();
    usePageTitle(t('first_setup.title'));

    return (
        <div className="vk-setup-wrapper">
            <div className="vk-setup-header">
                <h1 className="vk-setup-title">{t('first_setup.title')}</h1>
                <p className="vk-setup-subtitle">{t('first_setup.fill_details')}</p>
            </div>
            <ProfileSettings isSetupMode={true} />
        </div>
    );
}