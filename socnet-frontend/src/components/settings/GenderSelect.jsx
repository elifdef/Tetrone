import { useTranslation } from 'react-i18next';

const GenderSelect = ({ value, onChange, label }) => {
    const { t } = useTranslation();

    return (
        <div className="socnet-form-group">
            <label className="socnet-form-label">{label}</label>
            <div className="socnet-settings-group">
                <label className="socnet-radio-label">
                    <input
                        type="radio"
                        name="gender"
                        value="1"
                        checked={Number(value) === 1}
                        onChange={onChange}
                    />
                    {t('common.gender_male')}
                </label>

                <label className="socnet-radio-label">
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