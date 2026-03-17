import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePageTitle } from "../../hooks/usePageTitle";
import AdminService from '../../services/admin.service';
import { notifySuccess, notifyError } from '../common/Notify';
import { useTranslation } from 'react-i18next';
import Button from '../UI/Button';
import { useModal } from '../../context/ModalContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';

export default function AdminUserInfo() {
    const { username } = useParams();
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { openPrompt } = useModal();
    const formatDate = useDateFormatter();

    usePageTitle(username);

    const fetchUserDossier = async () => {
        setIsLoading(true);
        const res = await AdminService.getUserDossier(username);

        if (res.success) {
            setUser(res.data);
        } else {
            notifyError(t('admin.user_info.error_load'));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUserDossier();
    }, [username]);

    const handleToggleAction = async (actionType, currentStatus) => {
        const actionText = actionType === 'ban'
            ? (currentStatus ? t('admin.actions.unban') : t('admin.actions.ban'))
            : (currentStatus ? t('admin.actions.unmute') : t('admin.actions.mute'));

        const reason = await openPrompt(
            t('admin.actions.reason_prompt'), "", actionText, t('common.cancel')
        );

        if (reason === null) return;

        const finalReason = reason || t('admin.actions.reason_not_specified');

        const res = actionType === 'ban'
            ? await AdminService.toggleBan(username, finalReason)
            : await AdminService.toggleMute(username, finalReason);

        if (res.success) {
            notifySuccess(res.message);
            fetchUserDossier();
        } else {
            notifyError(res.message);
        }
    };

    if (isLoading) return <div className="socnet-empty-state">{t('admin.user_info.loading_dossier')}</div>;
    if (!user) return <div className="socnet-empty-state with-card">{t('admin.user_info.not_found')}</div>;

    return (
        <div className="admin-dossier-wrapper">
            <div className="socnet-card-wrapper admin-dossier-card">
                <h2 className="admin-dossier-title">
                    <a href={`/${user.username}`} className="socnet-link">
                        @{user.username}
                    </a>
                </h2>

                <div className="admin-dossier-row">
                    <div className="admin-dossier-col">
                        <p className="admin-info-item">
                            <span className="admin-info-label">ID:</span> {user.id}
                        </p>
                        <p className="admin-info-item">
                            <span className="admin-info-label">{t('admin.user_info.email_label')}:</span> {user.email}
                        </p>
                        <p className="admin-info-item">
                            <span className="admin-info-label">{t('common.first_name')}:</span> {user.first_name}
                        </p>
                        <p className="admin-info-item">
                            <span className="admin-info-label">{t('common.last_name')}:</span> {user?.last_name}
                        </p>
                        <p className="admin-info-item">
                            <span className="admin-info-label">{t('admin.user_info.registered_at')}:</span> {formatDate(user.created_at)}
                        </p>
                        <p className="admin-info-item">
                            <span className="admin-info-label">{t('admin.user_info.last_active')}:</span> {user.last_seen ? formatDate(user.last_seen) : t('admin.user_info.never')}
                        </p>
                        <p className="admin-info-item">
                            <span className="admin-info-label">{t('common.role')}:</span> {user.role}
                        </p>
                        <p className="admin-info-item">
                            <span className="admin-info-label">{t('admin.user_info.account_status')}:</span>
                            {user.is_banned
                                ? <span className="admin-status-red"> {t('admin.user_info.status_banned')}</span>
                                : <span className="admin-status-green"> {t('admin.user_info.status_active')}</span>
                            }
                            {user.is_muted && <span className="admin-status-orange"> {t('admin.user_info.status_muted')}</span>}
                        </p>
                    </div>

                    <div className="admin-stats-box">
                        <h4 className="admin-stats-title">{t('admin.user_info.content_stats')}</h4>
                        <p>{t('admin.user_info.posts_written')}: <strong className="admin-stat-value">{user.posts_count || 0}</strong></p>
                        <p>{t('admin.user_info.comments_left')}: <strong className="admin-stat-value">{user.comments_count || 0}</strong></p>
                        <p>{t('admin.user_info.likes_given')}: <strong className="admin-stat-value">{user.likes_count || 0}</strong></p>
                    </div>
                </div>

                <div className="admin-actions-box">
                    <h4 className="admin-actions-title">{t('admin.actions.title')}</h4>
                    <div className="admin-btn-group">
                        <Button
                            className="admin-btn-warning"
                            variant={user.is_muted ? 'primary' : 'save'}
                            onClick={() => handleToggleAction('mute', user.is_muted)}
                        >
                            {user.is_muted ? t('admin.actions.unmute') : t('admin.actions.mute')}
                        </Button>
                        <Button
                            className={user.is_banned ? 'admin-btn-unban' : 'admin-btn-ban'}
                            onClick={() => handleToggleAction('ban', user.is_banned)}
                        >
                            {user.is_banned ? t('admin.actions.unban') : t('admin.actions.ban')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="admin-tables-row">
                <div className="socnet-card-wrapper admin-table-card">
                    <h3 className="admin-table-title">{t('admin.user_info.recent_logins')}</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('common.date')}</th>
                                <th>{t('admin.user_info.ip_address')}</th>
                                <th>{t('admin.user_info.device')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {user.login_history && user.login_history.length > 0 ? (
                                user.login_history.map(log => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.created_at)}</td>
                                        <td><strong className="admin-ip-text">{log.ip_address}</strong></td>
                                        <td title={log.user_agent}>{log?.user_agent}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="admin-table-empty-row">
                                        {t('admin.user_info.history_empty')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="socnet-card-wrapper admin-table-card">
                    <h3 className="admin-table-title">{t('admin.user_info.violation_history')}</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('common.date')}</th>
                                <th>{t('admin.user_info.action')}</th>
                                <th>{t('admin.user_info.reason')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {user.moderation_logs && user.moderation_logs.length > 0 ? (
                                user.moderation_logs.map(log => {
                                    const isPositiveAction = log.action.includes('un');
                                    return (
                                        <tr key={log.id}>
                                            <td>{formatDate(log.created_at)}</td>
                                            <td>
                                                <span className={`admin-badge ${isPositiveAction ? 'admin-badge-positive' : 'admin-badge-negative'}`}>
                                                    {log.action.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="admin-reason-cell">{log.reason}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="3" className="admin-table-empty-row">
                                        {t('admin.user_info.no_violations')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}