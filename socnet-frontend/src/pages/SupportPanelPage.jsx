import { useEffect, useContext, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import { userRole } from '../config';
import { AdminTabs } from '../components/admin/AdminTabs';
import { UsersManager } from '../components/admin/UsersManager';
import AdminTickets from '../components/admin/AdminTickets';

const SupportPanelPage = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const isSupport = currentUser?.role === userRole.Support;
    const activeTab = searchParams.get('tab') || 'tickets';

    usePageTitle(t('common.support_panel'));

    useEffect(() => {
        if (!isSupport) navigate('/');
    }, [isSupport, navigate]);

    const tabs = useMemo(() => [
        { id: 'tickets', label: t('admin.support.support_tickets') },
        { id: 'users', label: t('admin.users_management') }
    ], [t]);

    const handleTabChange = (tabId) => { 
        setSearchParams({ tab: tabId }); 
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'tickets': return <AdminTickets />;
            case 'users': return <UsersManager canBan={false} />;
            default: return null;
        }
    };

    if (!isSupport) return null;

    return (
        <div className="tetrone-card-wrapper">
            <h2 className="tetrone-section-title">{t('common.support_panel')}</h2>
            
            <AdminTabs 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
            />

            <div className="admin-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default SupportPanelPage;