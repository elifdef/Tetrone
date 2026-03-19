import { useState, useContext, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { APP_NAME, userRole } from "../../config";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";

const LeftSidebar = () => {
    const { t } = useTranslation();
    const { logout, user } = useContext(AuthContext);
    const { unreadCount, unreadMessagesCount } = useContext(NotificationContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const closeMenu = () => setIsMobileOpen(false);

    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `socnet-nav-item ${isActive ? "active" : ""}`;
    };

    const handleLogout = () => {
        closeMenu();
        logout();
        navigate('/');
    };

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;
    const displayMsgCount = unreadMessagesCount > 99 ? '99+' : unreadMessagesCount;

    return (
        <>
            <div className="mobile-top-bar">
                <button
                    className="mobile-menu-btn-inline"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileOpen ? '✕' : '☰'}
                </button>

                <Link to="/" className="mobile-top-bar-logo" onClick={closeMenu}>
                    {APP_NAME}
                </Link>

                {user ? (
                    <Link to={`/${user.username}`} onClick={closeMenu} className="mobile-top-bar-avatar-link">
                        <img src={user.avatar} alt="avatar" className="mobile-top-bar-avatar" />
                    </Link>
                ) : (
                    <div style={{ width: '32px' }}></div>
                )}
            </div>

            <div
                className={`mobile-menu-overlay ${isMobileOpen ? 'active' : ''}`}
                onClick={closeMenu}
            />

            <aside className={`socnet-sidebar-left ${isMobileOpen ? 'mobile-open' : ''}`}>
                <Link to="/" className="socnet-logo" onClick={closeMenu}>
                    {APP_NAME}
                </Link>

                <nav className="socnet-nav-list">
                    {user ? (
                        <>
                            <Link to="/" className={getLinkClass("/")} onClick={closeMenu}>
                                {t('sidebar.left.home')}
                            </Link>
                            <Link to={`/${user.username}`} className={getLinkClass(`/${user.username}`)} onClick={closeMenu}>
                                {t('common.profile')}
                            </Link>
                            <Link to="/messages" className={getLinkClass("/messages")} onClick={closeMenu}>
                                {t('common.messages')}
                                {unreadMessagesCount > 0 && (<span className="socnet-badge">{displayMsgCount}</span>)}
                            </Link>
                            <Link to="/friends" className={getLinkClass("/friends")} onClick={closeMenu}>
                                {t('common.friends')}
                            </Link>
                            <Link to="/notifications" className={getLinkClass("/notifications")} onClick={closeMenu}>
                                {t('common.notifications')}
                                {unreadCount > 0 && (<span className="socnet-badge">{displayCount}</span>)}
                            </Link>
                            <Link to="/activity" className={getLinkClass("/activity")} onClick={closeMenu}>
                                {t('common.activity')}
                            </Link>
                            <Link to="/settings" className={getLinkClass("/settings")} onClick={closeMenu}>
                                {t('sidebar.left.settings')}
                            </Link>

                            {user.role === userRole.Support && (
                                <>
                                    <hr />
                                    <Link to="/support" className={`${getLinkClass("/support")} nav-link-support`} onClick={closeMenu}>
                                        {t('common.support_panel')}
                                    </Link>
                                </>
                            )}

                            {user.role === userRole.Moderator && (
                                <>
                                    <hr />
                                    <Link to="/moderation" className={`${getLinkClass("/moderation")} nav-link-moderator`} onClick={closeMenu}>
                                        {t('common.moderator_panel')}
                                    </Link>
                                </>
                            )}

                            {user.role === userRole.Admin && (
                                <>
                                    <hr />
                                    <Link to="/control-panel" className={`${getLinkClass("/admin")} nav-link-admin`} onClick={closeMenu}>
                                        {t('common.admin_panel')}
                                    </Link>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={getLinkClass("/login")} onClick={closeMenu}>
                                {t('auth.signin')}
                            </Link>
                            <Link to="/register" className={getLinkClass("/register")} onClick={closeMenu}>
                                {t('auth.signup')}
                            </Link>
                        </>
                    )}
                </nav>

                {user && (
                    <div className="socnet-sidebar-profile">
                        <Link to={`/${user.username}`} className="socnet-mini-profile-link" onClick={closeMenu}>
                            <img
                                src={user?.avatar}
                                alt="avatar"
                                className="socnet-mini-avatar"
                            />
                            <div className="socnet-mini-name">
                                {user.first_name || user.username}
                            </div>
                        </Link>
                        <button onClick={handleLogout} className="socnet-logout-btn">
                            {t('auth.signout')}
                        </button>
                    </div>
                )}

                {!user && (
                    <div className="socnet-sidebar-profile socnet-sidebar-guest-notice">
                        {t('sidebar.guest.view_like_guest')}
                    </div>
                )}
            </aside>
        </>
    );
};

export default LeftSidebar;