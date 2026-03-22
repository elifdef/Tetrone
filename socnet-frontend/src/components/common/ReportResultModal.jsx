import { useTranslation } from 'react-i18next';

export default function ReportResultModal({ payload, onClose }) {
    const { t } = useTranslation();

    if (!payload) return null;

    const isResolved = payload.status === 'resolved';
    const moderatorName = payload.moderator_name || t('reports.system_moderator');
    const targetContent = payload.target_content || t('reports.content_unavailable');

    return (
        <div className="tetrone-modal-overlay" onClick={onClose}>
            <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>

                <div className="tetrone-modal-message">
                    {t('reports.review_result_title')}
                </div>

                <div className="tetrone-info-block">
                    <div className="tetrone-info-row">
                        <span className="tetrone-label">{t('reports.status_label')}</span>
                        <strong className={`tetrone-value ${isResolved ? 'admin-status-green' : 'admin-status-red'}`}>
                            {isResolved
                                ? t('reports.status_deleted')
                                : t('reports.status_kept')}
                        </strong>
                    </div>

                    <div className="tetrone-info-row">
                        <span className="tetrone-label">{t('reports.moderator_label')}</span>
                        <span className="tetrone-value">{moderatorName}</span>
                    </div>

                    <div className="tetrone-info-row">
                        <span className="tetrone-label">{t('reports.content_label')}</span>
                        <span className="tetrone-value">
                            <div className="tetrone-settings-quote">
                                "{targetContent}"
                            </div>
                        </span>
                    </div>
                </div>

                {payload.admin_response && (
                    <div className="banned-reason-box">
                        <div className="banned-reason-label">{t('reports.moderator_response')}</div>
                        <div className="banned-reason-text">{payload.admin_response}</div>
                    </div>
                )}

                <div className="tetrone-modal-actions">
                    <button className="tetrone-btn" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                </div>

            </div>
        </div>
    );
}