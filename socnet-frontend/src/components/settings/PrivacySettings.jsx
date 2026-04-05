import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PrivacyService from '../../services/privacy.service';
import { notifyError, notifySuccess } from '../common/Notify';
import Button from '../ui/Button';
import PrivacyExceptionsModal from '../modals/PrivacyExceptionsModal';

const PRIVACY_CONTEXTS = [
    'profile',
    'avatar',
    'dob',
    'country',
    'message',
    'wall_post',
    'comment'
];

export default function PrivacySettings() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [initialSettings, setInitialSettings] = useState({});
    const [localSettings, setLocalSettings] = useState({});
    const [exceptions, setExceptions] = useState([]);

    const [activeModalContext, setActiveModalContext] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const res = await PrivacyService.getSettings();
            if (res.success) {
                const fetchedSettings = res.data.settings || {};
                setInitialSettings(fetchedSettings);
                setLocalSettings(fetchedSettings);
                setExceptions(res.data.exceptions || []);
            } else {
                notifyError(res.message || t('common.error'));
            }
        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const isDirty = useMemo(() => {
        return JSON.stringify(initialSettings) !== JSON.stringify(localSettings);
    }, [initialSettings, localSettings]);

    const handleLocalChange = (context, newLevel) => {
        setLocalSettings(prev => ({
            ...prev,
            [context]: parseInt(newLevel, 10)
        }));
    };

    const handleSaveAll = async () => {
        if (!isDirty) return;
        setIsSaving(true);

        try {
            const changedKeys = Object.keys(localSettings).filter(
                key => localSettings[key] !== initialSettings[key]
            );

            const promises = changedKeys.map(context =>
                PrivacyService.updateSetting(context, localSettings[context])
            );

            await Promise.all(promises);

            setInitialSettings(localSettings);
            notifySuccess(t('settings.privacy_saved'));
        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="tetrone-loading">{t('common.loading')}</div>;

    return (
        <div className="tetrone-settings-form">
            <div className="tetrone-sessions-header">
                <h3 className="tetrone-sessions-main-title">{t('settings.privacy_title')}</h3>
                <p className="tetrone-sessions-desc">{t('settings.privacy_desc')}</p>
            </div>

            <div className="tetrone-settings-box tetrone-sessions-box-no-margin">
                <div className="tetrone-sessions-list">
                    {PRIVACY_CONTEXTS.map(context => {
                        const currentValue = localSettings[context] !== undefined ? localSettings[context] : 0;

                        return (
                            <div key={context} className="tetrone-privacy-row">
                                <div className="tetrone-privacy-label-wrapper">
                                    <span className="tetrone-privacy-label">
                                        {t(`privacy.context_${context}`)}
                                    </span>
                                </div>

                                <div className="tetrone-privacy-controls">
                                    <select
                                        className="tetrone-form-select tetrone-privacy-select"
                                        value={currentValue}
                                        onChange={(e) => handleLocalChange(context, e.target.value)}
                                    >
                                        <option value={0}>{t('privacy.level_everyone')}</option>
                                        <option value={1}>{t('privacy.level_friends')}</option>
                                        <option value={2}>{t('privacy.level_nobody')}</option>
                                        <option value={3}>{t('privacy.level_custom')}</option>
                                    </select>

                                    {currentValue === 3 && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => setActiveModalContext(context)}
                                        >
                                            {t('privacy.manage_exceptions')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="tetrone-privacy-footer">
                <Button
                    variant="primary"
                    onClick={handleSaveAll}
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? t('common.loading') : t('common.save_changes')}
                </Button>
            </div>

            <PrivacyExceptionsModal
                isOpen={!!activeModalContext}
                context={activeModalContext}
                onClose={() => setActiveModalContext(null)}
                initialExceptions={exceptions}
                onSaveSuccess={loadSettings}
            />
        </div>
    );
}