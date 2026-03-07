import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import { notifySuccess, notifyError } from "../common/Notify";
import { useModal } from "../../context/ModalContext";

export default function AdminAppeals() {
    const { t } = useTranslation();
    const { openPrompt } = useModal();

    const [appeals, setAppeals] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');

    const fetchAppeals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/appeals?status=${statusFilter}`);
            setStats(res.data.stats);
            setAppeals(res.data.appeals.data);
        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setLoading(false);
        }
    }, [statusFilter, t]);

    useEffect(() => {
        fetchAppeals();
    }, [fetchAppeals]);

    const handleAction = async (appealId, actionType) => {
        const title = actionType === 'resolve' ? t('admin.prompt_approve_appeal') : t('admin.prompt_reject_appeal');

        const responseText = await openPrompt(
            t('admin.prompt_placeholder'),
            title,
            true
        );

        if (responseText === null) return;

        try {
            const endpoint = `/admin/appeals/${appealId}/${actionType}`;
            await api.post(endpoint, { admin_response: responseText.trim() });

            notifySuccess(t('common.saved'));
            fetchAppeals();
        } catch (error) {
            notifyError(error.response?.data?.message || t('common.error'));
        }
    };

    return (
        <div>
            <div className="admin-dossier-row" style={{ marginBottom: '20px' }}>
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('admin.stats_total')}</div>
                    <div className="admin-stats-value">{stats.total}</div>
                </div>
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('admin.stats_pending')}</div>
                    <div className="admin-stats-value admin-status-orange">{stats.pending}</div>
                </div>
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('admin.stats_approved')}</div>
                    <div className="admin-stats-value admin-status-green">{stats.approved}</div>
                </div>
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('admin.stats_rejected')}</div>
                    <div className="admin-stats-value admin-status-red">{stats.rejected}</div>
                </div>
            </div>

            <div className="socnet-tabs">
                <button
                    className={`socnet-tab ${statusFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('pending')}
                >
                    {t('admin.stats_pending')}
                </button>
                <button
                    className={`socnet-tab ${statusFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('approved')}
                >
                    {t('admin.stats_approved')}
                </button>
                <button
                    className={`socnet-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('rejected')}
                >
                    {t('admin.stats_rejected')}
                </button>
            </div>

            {loading ? (
                <div className="socnet-empty-state">{t('common.loading')}</div>
            ) : appeals.length === 0 ? (
                <div className="socnet-empty-state with-card">{t('admin.empty_appeals')}</div>
            ) : (
                <div className="socnet-feed-list">
                    {appeals.map((appeal) => (
                        <div key={appeal.id} className="admin-user-card">
                            <div className="admin-user-info">

                                <div className="socnet-info-row">
                                    <span className="socnet-label">{t('admin.appeal_from')}</span>
                                    <span className="socnet-value">
                                        <Link to={`/${appeal.user?.username}`} className="socnet-link" target="_blank">
                                            {appeal.user?.first_name} {appeal.user?.last_name} (@{appeal.user?.username})
                                        </Link>
                                    </span>
                                </div>

                                <div className="socnet-info-row">
                                    <span className="socnet-label">{t('admin.appeal_message')}</span>
                                    <span className="socnet-value">
                                        <div className="socnet-settings-quote" style={{ marginTop: '5px' }}>
                                            {appeal.message}
                                        </div>
                                    </span>
                                </div>

                                {appeal.admin_response && (
                                    <div className="banned-reason-box" style={{ marginTop: '15px', marginBottom: '0' }}>
                                        <div className="banned-reason-label">{t('admin.admin_response')}</div>
                                        <div className="banned-reason-text">{appeal.admin_response}</div>
                                    </div>
                                )}
                            </div>

                            {appeal.status === 'pending' && (
                                <div className="admin-user-actions">
                                    <button
                                        className="admin-btn admin-btn-save"
                                        onClick={() => handleAction(appeal.id, 'resolve')}
                                    >
                                        {t('admin.btn_approve_appeal')}
                                    </button>
                                    <button
                                        className="admin-btn admin-btn-danger"
                                        onClick={() => handleAction(appeal.id, 'reject')}
                                    >
                                        {t('admin.btn_reject_appeal')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}