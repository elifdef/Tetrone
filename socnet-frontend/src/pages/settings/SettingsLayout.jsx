import { useState, useEffect, useContext } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import UserProfileCard from '../../components/profile/UserProfileCard';

const SettingsLayout = () => {
    const { user, setUser } = useContext(AuthContext);
    const [previewUser, setPreviewUser] = useState(user);
    const location = useLocation();

    useEffect(() => {
        if (user) {
            setPreviewUser(user);
        }
    }, [user]);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/security')) return 'Безпека';
        return 'Налаштування профілю';
    };

    usePageTitle(getPageTitle());

    if (!user) return <div className="vk-settings-page">Завантаження...</div>;

    return (
        <div className="vk-settings-page">
            <div>
                <UserProfileCard currentUser={previewUser} isPreview={true} />
            </div>

            <div className="vk-settings-tabs">
                <NavLink to="profile" className={({ isActive }) => `vk-settings-tab ${isActive ? 'active' : ''}`}>
                    Профіль
                </NavLink>
                <NavLink to="security" className={({ isActive }) => `vk-settings-tab ${isActive ? 'active' : ''}`}>
                    Безпека
                </NavLink>
            </div>
            <Outlet context={{ user, setUser, previewUser, setPreviewUser }} />
        </div>
    );
};

export default SettingsLayout;