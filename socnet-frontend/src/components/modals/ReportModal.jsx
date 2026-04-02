import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReportService from '../../services/report.service';
import { notifySuccess, notifyError } from '../common/Notify';
import Button from '../ui/Button';

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
    const { t } = useTranslation();
    const [reasons, setReasons] = useState([]);
    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingReasons, setIsLoadingReasons] = useState(false);

    useEffect(() => {
        if (isOpen && reasons.length === 0) {
            const fetchReasons = async () => {
                setIsLoadingReasons(true);
                const res = await ReportService.getReasons();
                if (res.success) {
                    const data = res.data.reasons || [];
                    setReasons(data);
                    if (data.length > 0) setSelectedReason(data[0]);
                } else {
                    notifyError(res.message || t('reports.error_load_reasons'));
                }
                setIsLoadingReasons(false);
            };
            fetchReasons();
        }
    }, [isOpen, reasons.length, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReason || !targetId) {
            notifyError(t('common.error'));
            return;
        }

        setIsSubmitting(true);
        const res = await ReportService.submitReport({
            type: targetType, id: targetId, reason: selectedReason, details: details
        });

        if (res.success) {
            notifySuccess(res.message || t('reports.success'));
            handleClose();
        } else {
            notifyError(res.message || t('common.error'));
        }
        setIsSubmitting(false);
    };

    const handleClose = () => {
        setDetails('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="tetrone-modal-overlay" onClick={handleClose}>
            <div className="tetrone-modal-dialog" onClick={e => e.stopPropagation()}>
                <div className="tetrone-modal-header">
                    <h3>{t('reports.title')}</h3>
                    <button className="tetrone-modal-close" onClick={handleClose}>✖</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="tetrone-modal-body">
                        {isLoadingReasons ? (
                            <div className="tetrone-empty-state">{t('common.loading')}</div>
                        ) : (
                            <>
                                <div className="tetrone-form-group">
                                    <label className="tetrone-form-label">{t('reports.reason_label')}</label>
                                    <select
                                        className="tetrone-form-select"
                                        value={selectedReason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        required
                                    >
                                        {reasons.map(r => (
                                            <option key={r} value={r}>
                                                {t(`reports.reasons.${r}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="tetrone-form-group">
                                    <label className="tetrone-form-label">{t('reports.details_label')}</label>
                                    <textarea
                                        className="tetrone-form-textarea"
                                        placeholder={t('reports.details_placeholder')}
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        rows="4"
                                        maxLength="1000"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="tetrone-modal-footer">
                        <Button variant="secondary" onClick={handleClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" className="tetrone-btn" disabled={isSubmitting || isLoadingReasons}>
                            {isSubmitting ? t('common.saving') : t('reports.submit_btn')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}