import { useTranslation } from 'react-i18next';
import LabeledInput from "../UI/LabeledInput";

const AvatarUpload = ({ onFileSelect }) => {
    const { t } = useTranslation();
    
    return (
        <LabeledInput
            type="file"
            label={t('common.avatar')}
            onFileSelect={onFileSelect}
            btnText={t('first_setup.upload_avatar')}
            accept="image/*"
        />
    );
};

export default AvatarUpload;