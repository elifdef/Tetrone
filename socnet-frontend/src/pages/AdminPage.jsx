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

const AdminPage = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    usePageTitle(t('common.admin_panel'));

    const isAdmin = currentUser?.role === userRole.Admin;
    const isModerator = currentUser?.role === userRole.Moderator;

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || (isAdmin ? 'dashboard' : 'reports');

    useEffect(() => {
        if (!isAdmin && !isModerator) {
            navigate('/');
        }
    }, [isAdmin, isModerator, navigate]);

    // кешуєм вкладки щоб вони не перестворювалися при кожному рендері
    const adminTabs = useMemo(() => {
        const tabs = [];

        if (isAdmin) {
            tabs.push({ id: 'dashboard', label: t('admin.dashboard.title') });
        }

        if (isAdmin || isModerator) {
            tabs.push({ id: 'reports', label: t('admin.reports.tab') });
            tabs.push({ id: 'appeals', label: t('admin.appeals.tab') });
            tabs.push({ id: 'posts', label: t('common.posts') });
            tabs.push({ id: 'users', label: t('admin.users_management') });
        }

        return tabs;
    }, [isAdmin, isModerator, t]);

    const handleTabChange = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return isAdmin ? <AdminDashboard /> : null;
            case 'reports':
                return <AdminReports />;
            case 'posts':
                return <PostsManager currentUser={currentUser} />;
            case 'users':
                return <UsersManager canBan={true} />;
            case 'appeals':
                return <AdminAppeals />;
            default:
                return null;
        }
    };

    if (!isAdmin && !isModerator) return null;

    return (
        <div className="socnet-card-wrapper">
            <h2 className="socnet-section-title">{t('common.admin_panel')}</h2>

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