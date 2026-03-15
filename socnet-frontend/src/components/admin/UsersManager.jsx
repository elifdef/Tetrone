import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import AdminService from '../../services/admin.service';
import { userRole } from '../../config';
import { notifySuccess, notifyError } from "../common/Notify";
import { AuthContext } from "../../context/AuthContext";
import { useModal } from '../../context/ModalContext';
import { usePageTitle } from "../../hooks/usePageTitle";
import Button from '../UI/Button';
import Input from '../UI/Input';

const UserSearchForm = ({ search, setSearch, handleSearch }) => {
    const { t } = useTranslation();

    return (
        <form onSubmit={handleSearch} className="admin-search-bar admin-user-search">
            <div className="admin-post-search-input">
                <Input
                    label={t('admin.search_user')}
                    type="text"
                    className="socnet-form-input"
                    placeholder={t('admin.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button type="submit">{t('common.find')}</Button>
        </form>
    );
};

const UserCard = ({ user, handleMute, handleBan, canBan }) => {
    const { t } = useTranslation();
    const { user: currentAdmin } = useContext(AuthContext);
    const isAdmin = currentAdmin?.role === userRole.Admin;

    const profilePath = `/${isAdmin ? 'admin/users/' : ''}${user.username}`;

    return (
        <div className="admin-user-card">
            <img src={user.avatar} alt={user.username} className="admin-user-avatar" />

            <div className="admin-user-info">
                <a
                    href={profilePath}
                    className="admin-user-name"
                    target="_blank"
                    rel="noreferrer"
                >
                    {user.first_name} {user.last_name}
                </a>
                <div className="admin-user-meta">
                    {`@${user.username} • ${user.email} • ${t('admin.user_info.posts_count', { count: user.posts_count || 0 })}`}
                </div>
                <div className="admin-user-status">
                    {user.is_banned ? (
                        <span className="admin-status-banned">{t('admin.user_info.status_banned_full')}</span>
                    ) : user.is_muted ? (
                        <span className="admin-status-muted">{t('admin.read_only')}</span>
                    ) : null}
                </div>
            </div>

            {user.role <= userRole.Moderator && (
                <div className="admin-user-actions">
                    <button
                        className={`admin-btn admin-btn-warning ${user.is_muted ? 'active' : ''}`}
                        onClick={() => handleMute(user.username, user.is_muted)}
                    >
                        {user.is_muted ? t('admin.allow_posting') : t('admin.forbid_posting')}
                    </button>
                    {canBan && (
                        <button
                            className={`admin-btn admin-btn-danger ${user.is_banned ? 'active' : ''}`}
                            onClick={() => handleBan(user.username, user.is_banned)}
                        >
                            {user.is_banned ? t('admin.actions.unban') : t('admin.actions.ban')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export const UsersManager = ({ canBan = true }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { openPrompt } = useModal();

    usePageTitle(t('admin.users_management'));

    const fetchUsers = async (searchQuery = '') => {
        setIsLoading(true);
        try {
            // Використовуємо наш новий AdminService
            const { items } = await AdminService.getUsers(searchQuery);
            setUsers(items);
        } catch (error) {
            console.error("Error loading users:", error.data?.message || error.message);
            notifyError(t('admin.error_load_users'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(search);
    };

    const handleMute = async (username, currentStatus) => {
        const reason = await openPrompt(
            t('admin.actions.reason_prompt'),
            "",
            currentStatus ? t('admin.actions.unmute') : t('admin.read_only'),
            t('common.cancel')
        );

        if (reason === null) return;

        try {
            const res = await AdminService.toggleMute(username, reason);

            // fetchClient вже повернув розпарсений об'єкт
            setUsers(prevUsers =>
                prevUsers.map(u => u.username === username ? { ...u, is_muted: !currentStatus } : u)
            );
            notifySuccess(res.message || t('success.changes_saved'));

        } catch (error) {
            notifyError(error.data?.message || t('common.error'));
        }
    };

    const handleBan = async (username, currentStatus) => {
        const reason = await openPrompt(
            t('admin.actions.reason_prompt'),
            "",
            currentStatus ? t('admin.actions.unban') : t('admin.actions.ban'),
            t('common.cancel')
        );

        if (reason === null) return;

        try {
            const res = await AdminService.toggleBan(username, reason);

            setUsers(prevUsers =>
                prevUsers.map(u => u.username === username ? { ...u, is_banned: !currentStatus } : u)
            );
            notifySuccess(res.message || t('success.changes_saved'));

        } catch (error) {
            notifyError(error.data?.message || t('common.error'));
        }
    };

    return (
        <div className="admin-users-manager-wrapper">
            <UserSearchForm
                search={search}
                setSearch={setSearch}
                handleSearch={handleSearch}
            />

            {isLoading ? (
                <div className="socnet-empty-state">{t('common.loading')}</div>
            ) : (
                <div className="admin-users-list">
                    {users.map(user => (
                        <UserCard
                            key={user.id}
                            user={user}
                            handleMute={handleMute}
                            handleBan={handleBan}
                            canBan={canBan}
                        />
                    ))}
                    {users.length === 0 && (
                        <div className="socnet-empty-state with-card">
                            {t('admin.users_not_found')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};