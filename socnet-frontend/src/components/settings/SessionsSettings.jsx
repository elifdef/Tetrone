import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthService from '../../services/auth.service';
import { notifySuccess, notifyError } from '../common/Notify';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useModal } from '../../context/ModalContext';
import { parseUserAgent } from '../../utils/userAgent';
import Button from '../UI/Button';

export default function SessionsSettings() {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { openConfirm } = useModal();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchSessions = async () => {
        setIsLoading(true);
        const res = await AuthService.getSessions();
        if (res.success) {
            setSessions(res.data || []);
        } else {
            notifyError(res.message || t('error.load_data'));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeSession = async (tokenId) => {
        const confirmed = await openConfirm(t('common.are_u_sure'));
        if (!confirmed) return;

        setIsActionLoading(true);
        const res = await AuthService.revokeSession(tokenId);
        if (res.success) {
            notifySuccess(res.message || t('common.deleted'));
            setSessions(prev => prev.filter(s => s.id !== tokenId));
        } else {
            notifyError(res.message || t('error.delete_data'));
        }
        setIsActionLoading(false);
    };

    const handleRevokeAllOther = async () => {
        const confirmed = await openConfirm(t('common.are_u_sure'));
        if (!confirmed) return;

        setIsActionLoading(true);
        const res = await AuthService.revokeAllOtherSessions();
        if (res.success) {
            notifySuccess(res.message || t('common.saved'));
            setSessions(prev => prev.filter(s => s.is_current));
        } else {
            notifyError(res.message || t('error.delete_data'));
        }
        setIsActionLoading(false);
    };

    if (isLoading) return <div className="socnet-loading">{t('common.loading')}</div>;

    const currentSession = sessions.find(s => s.is_current);
    const otherSessions = sessions.filter(s => !s.is_current);

    const renderSessionCard = (session, isCurrent = false) => {
        const { os, browser, OsIcon } = parseUserAgent(session.user_agent);

        return (
            <div key={session.id} className={`socnet-session-card ${isCurrent ? 'current' : ''}`}>
                <div className="socnet-session-icon-wrapper">
                    <OsIcon className="socnet-session-icon-svg" title={os} />
                </div>

                <div className="socnet-session-info">
                    <div className="socnet-session-device">
                        {os} • {browser}
                        {isCurrent && <span className="socnet-session-badge">{t('settings.current_session', 'Поточний')}</span>}
                    </div>
                    <div className="socnet-session-meta">
                        <span className="socnet-session-ip">{session.ip_address}</span>
                        <span className="socnet-session-dot">•</span>
                        {isCurrent ? (
                            <span className="socnet-text-success">{t('common.online')}</span>
                        ) : (
                            <span>{formatDate(session.last_used_at)}</span>
                        )}
                    </div>
                    <div className="socnet-session-ua" title={session.user_agent}>
                        {session.user_agent}
                    </div>
                </div>

                {!isCurrent && (
                    <Button
                        className="socnet-btn-cancel socnet-session-close-btn"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={isActionLoading}
                        title={t('common.close')}
                    >
                        {t('common.close')}
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="socnet-settings-form">
            <div className="socnet-sessions-header">
                <h3 className="socnet-sessions-main-title">{t('settings.sessions')}</h3>
                <p className="socnet-sessions-desc">{t('settings.sessions_desc')}</p>
            </div>

            <div className="socnet-settings-box">
                <strong className="socnet-sessions-subtitle">{t('settings.current_session', 'Поточний пристрій')}</strong>
                {currentSession && renderSessionCard(currentSession, true)}
            </div>

            {otherSessions.length > 0 && (
                <div className="socnet-settings-box socnet-sessions-box-no-margin">
                    <div className="socnet-sessions-section-header">
                        <strong className="socnet-sessions-subtitle-clean">{t('settings.other_sessions', 'Інші пристрої')}</strong>
                        <Button
                            className="socnet-btn-ghost danger socnet-sessions-terminate-btn"
                            onClick={handleRevokeAllOther}
                            disabled={isActionLoading}
                        >
                            {t('settings.terminate_all')}
                        </Button>
                    </div>

                    <div className="socnet-sessions-list">
                        {otherSessions.map(session => renderSessionCard(session))}
                    </div>
                </div>
            )}
        </div>
    );
}