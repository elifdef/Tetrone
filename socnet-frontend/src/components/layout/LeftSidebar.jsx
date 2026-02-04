import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { APP_NAME } from "../../config";
import { AuthContext } from "../../context/AuthContext";

const UserNav = ({ user, getLinkClass }) => (
    <>
        <Link to={`/${user.username}`} className={getLinkClass(`/${user.username}`)}>
            Моя сторінка
        </Link>
        <Link to="/messages" className={getLinkClass("/messages")}>
            Повідомлення
        </Link>
        <Link to="/friends" className={getLinkClass("/friends")}>
            <span>Друзі</span>
        </Link>
        <Link to="/settings" className={getLinkClass("/settings")}>
            Налаштування
        </Link>
    </>
);

const GuestNav = ({ getLinkClass }) => (
    <>
        <div style={{ padding: '10px 0', color: '#71767b', fontSize: '13px' }}>
            Ви переглядаєте сайт як гість.
        </div>
        <Link to="/login" className={getLinkClass("/login")}>
            Увійти
        </Link>
        <Link to="/register" className={getLinkClass("/register")}>
            Реєстрація
        </Link>
    </>
);

const LeftSidebar = () => {
    const { logout, user } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `nav-link ${isActive ? "active" : ""}`;
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="sidebar">
            <div>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h1>{APP_NAME}</h1>
                </Link>
            </div>

            <nav>
                <Link to="/" className={getLinkClass("/")}>
                    Головна
                </Link>

                {user ? (
                    <UserNav user={user} getLinkClass={getLinkClass} />
                ) : (
                    <GuestNav getLinkClass={getLinkClass} />
                )}
            </nav>

            {user ? (
                <div className="sidebar-user-block">
                    <Link to={`/${user.username}`} className="mini-user-info">
                        <img
                            src={user.avatar}
                            alt="avatar"
                            className="mini-avatar"
                        />
                        <div className="mini-user-text">
                            <span className="mini-name">{user.first_name}</span>
                            <span className="mini-nick">@{user.username}</span>
                        </div>
                    </Link>

                    <button onClick={handleLogout} className="btn-logout">
                        Вийти
                    </button>
                </div>
            ) : (
                <div className="sidebar-user-block">
                    <span style={{ fontSize: '12px', color: '#71767b' }}>
                        Авторизуйтесь, щоб отримати повний доступ.
                    </span>
                </div>
            )}
        </aside>
    );
};

export default LeftSidebar;