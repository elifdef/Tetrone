import { useTranslation } from 'react-i18next';

const GenderSelect = ({ value, onChange }) => {
    const { t } = useTranslation();

    return (
        <div className="vk-form-group">
            <label className="vk-form-label">{t('common.gender')}</label>
            <div className="vk-settings-group">
                <label className="vk-radio-label">
                    <input
                        type="radio"
                        name="gender"
                        value="1"
                        checked={Number(value) === 1}
                        onChange={onChange}
                    />
                    {t('common.gender_male')}
                </label>

                <label className="vk-radio-label">
                    <input
                        type="radio"
                        name="gender"
                        value="2"
                        checked={Number(value) === 2}
                        onChange={onChange}
                    />
                    {t('common.gender_female')}
                </label>
            </div>
        </div>
    );
};

export default GenderSelect;