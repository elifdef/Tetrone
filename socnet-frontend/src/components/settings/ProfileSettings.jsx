import { useTranslation } from 'react-i18next';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import UserProfileCard from '../profile/UserProfileCard';

import LabeledInput from '../UI/LabeledInput';
import DateInput from '../UI/DateInput';
import Button from '../UI/Button';
import Label from '../UI/Label';
import Textarea from '../UI/Textarea';

import GenderSelect from './GenderSelect';
import CountrySelect from './CountrySelect';
import AvatarUpload from './AvatarUpload';

const ProfileSettings = ({ isSetupMode = false }) => {
    const { t } = useTranslation();

    const {
        formData,
        previewUser,
        canSubmit,
        handleChange,
        handleFileChange,
        handleSubmit
    } = useProfileSettings(isSetupMode);

    const renderForm = () => (
        <form onSubmit={handleSubmit} className="vk-settings-form" style={isSetupMode ? { border: 'none', padding: 0 } : {}}>

            <div style={isSetupMode ? { padding: '15px', background: 'var(--theme-bg-page)', border: '1px solid var(--theme-border)', marginBottom: '15px' } : {}}>
                <AvatarUpload onFileSelect={handleFileChange} />
            </div>

            <div className="vk-form-row">
                <LabeledInput
                    label={`${t('common.first_name')} *`}
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    maxLength={50}
                    required
                />
                <LabeledInput
                    label={t('common.last_name')}
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    maxLength={50}
                />
            </div>

            <DateInput
                label={`${t('common.birthday')} *`}
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                required={isSetupMode}
            />

            <GenderSelect value={formData.gender} onChange={handleChange} />
            <CountrySelect value={formData.country} onChange={handleChange} />

            <div className="vk-form-group">
                <Label>{t('settings.about_me')}</Label>
                <Textarea
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    maxLength={1000}
                />
            </div>

            <Button
                type="submit"
                variant="save"
                disabled={!canSubmit}
                style={isSetupMode ? { width: '100%' } : {}}
            >
                {t(isSetupMode ? 'first_setup.save_and_finish' : 'common.save')}
            </Button>
        </form>
    );

    if (isSetupMode)
        return (
            <div className="vk-setup-layout">
                <div className="vk-setup-form-col">
                    {renderForm()}
                </div>
                <div className="vk-setup-preview-col">
                    <div className="vk-preview-label">{t('common.preview')}</div>
                    <UserProfileCard currentUser={previewUser} isPreview={true} />
                </div>
            </div>
        );

    return (
        <div className="vk-settings-regular">
            <UserProfileCard currentUser={previewUser} isPreview={true} />
            {renderForm()}
        </div>
    );
};

export default ProfileSettings;