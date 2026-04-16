import { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import { userRole } from '../config';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminReports from '../components/admin/AdminReports';
import { PostsManager } from '../components/admin/PostsManager';
import { UsersManager } from '../components/admin/UsersManager';
import { AdminTabs } from '../components/admin/AdminTabs';
import AdminAppeals from '../components/admin/AdminAppeals';
import AdminTickets from '../components/admin/AdminTickets';

const AdminPage = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    usePageTitle(t('common.admin_panel'));

    const isAdmin = currentUser?.role === userRole.Admin;

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
        }
    }, [isAdmin, navigate]);

    const adminTabs = useMemo(() => [
        { id: 'dashboard', label: t('admin.dashboard.title') },
        { id: 'reports', label: t('admin.reports.tab') },
        { id: 'appeals', label: t('admin.appeals.tab') },
        { id: 'tickets', label: t('admin.support.support_tickets') },
        { id: 'posts', label: t('common.posts') },
        { id: 'users', label: t('admin.users_management') }
    ], [t]);

    const handleTabChange = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <AdminDashboard />;
            case 'reports': return <AdminReports />;
            case 'appeals': return <AdminAppeals />;
            case 'tickets': return <AdminTickets />;
            case 'posts': return <PostsManager currentUser={currentUser} />;
            case 'users': return <UsersManager canBan={true} />;
            default: return null;
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="tetrone-card-wrapper">
            <h2 className="tetrone-section-title">{t('common.admin_panel')}</h2>

            <AdminTabs
                tabs={adminTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            <div className="admin-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPage;