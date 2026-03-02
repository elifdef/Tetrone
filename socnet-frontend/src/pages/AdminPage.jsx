import { useTranslation } from 'react-i18next';
import { usePageTitle } from "../hooks/usePageTitle";
import { UsersManager } from '../components/admin/UsersManager';

const AdminPage = () => {
    const { t } = useTranslation();
    usePageTitle(t('common.admin_panel'));

    return (
        <div className="socnet-card-wrapper">
            <h2 className="socnet-section-title">{t('common.admin_panel')}</h2>
            <UsersManager canBan={true} />
        </div>
    );
};

export default AdminPage;