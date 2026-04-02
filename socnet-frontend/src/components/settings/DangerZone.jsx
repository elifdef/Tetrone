import { notifyWarn } from "../common/Notify";
import Button from "../ui/Button";

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
                <Button variant="danger" onClick={() => notifyWarn('under construction')}>
                    {t('settings.delete_account')}
                </Button>
            </div>
        </div>
    );
};

export default DangerZone;