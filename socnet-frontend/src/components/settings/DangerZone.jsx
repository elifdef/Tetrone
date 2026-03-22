import { notifyWarn } from "../common/Notify";

const DangerZone = ({ t }) => {
    return (
        <div className="tetrone-settings-danger">
            <div className="tetrone-settings-danger-header">{t('settings.danger_zone')}</div>
            <div className="tetrone-settings-danger-body">
                <div>
                    <h4>{t('settings.delete_account')}</h4>
                    <div className="tetrone-settings-quote">{t('settings.quote')}</div>
                    <p className="tetrone-settings-desc">{t('settings.delete_warning')}</p>
                </div>
                <button className="tetrone-btn-delete" onClick={() => notifyWarn('under construction')}>
                    {t('settings.delete_account')}
                </button>
            </div>
        </div>
    );
};

export default DangerZone;