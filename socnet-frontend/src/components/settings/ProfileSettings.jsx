import { useTranslation } from 'react-i18next';
import { useProfileSettings } from './hooks/useProfileSettings';
import UserProfileCard from '../profile/UserProfileCard';

import Input from '../ui/Input';
import DateInput from '../ui/DateInput';
import Button from '../ui/Button';
import Label from '../ui/Label';
import Textarea from '../ui/Textarea';
import ImageDropzone from './ImageDropzone';
import GenderSelect from './GenderSelect';
import CountrySelect from './CountrySelect';

const ProfileSettings = ({ isSetupMode = false }) => {
    const { t } = useTranslation();

    const {
        formData,
        previewUser,
        canSubmit,
        handleChange,
        handleFileChange,
        handleSubmit,
        avatarFile
    } = useProfileSettings(isSetupMode);

    const renderForm = () => (
        <form
            onSubmit={handleSubmit}
            className={`tetrone-settings-form ${isSetupMode ? 'tetrone-settings-form-setup' : ''}`}
        >
            <div className="tetrone-form-group">
                <Label>{t('common.avatar')}</Label>
                <ImageDropzone
                    onFileSelect={handleFileChange}
                    fileName={avatarFile ? avatarFile.name : null}
                />
            </div>

            <div className="tetrone-form-row">
                <div className="tetrone-form-group">
                    <Input
                        label={`${t('common.first_name')} *`}
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        maxLength={50}
                        required
                    />
                </div>
                <div className="tetrone-form-group">
                    <Input
                        label={t('common.last_name')}
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        maxLength={50}
                    />
                </div>
            </div>

            <DateInput
                label={`${t('common.birthday')} *`}
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                required={isSetupMode}
            />

            <GenderSelect
                value={formData.gender}
                onChange={handleChange}
                required={isSetupMode}
                label={`${t('common.gender')} *`}
            />

            <CountrySelect value={formData.country} onChange={handleChange} />

            <div className="tetrone-form-group">
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
                className={isSetupMode ? 'tetrone-btn-full-width' : ''}
            >
                {t(isSetupMode ? 'first_setup.save_and_finish' : 'common.save')}
            </Button>
        </form>
    );

    if (isSetupMode)
        return (
            <div className="tetrone-setup-layout">
                <div className="tetrone-setup-form-col">
                    {renderForm()}
                </div>
                <div className="tetrone-setup-preview-col">
                    <div className="tetrone-preview-label">{t('common.preview')}</div>
                    <UserProfileCard currentUser={previewUser} isPreview={true} />
                </div>
            </div>
        );

    return (
        <div className="tetrone-settings-regular">
            <UserProfileCard currentUser={previewUser} isPreview={true} />
            {renderForm()}
        </div>
    );
};

export default ProfileSettings;