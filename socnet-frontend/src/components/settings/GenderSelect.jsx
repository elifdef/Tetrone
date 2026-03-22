import { useTranslation } from 'react-i18next';

const GenderSelect = ({ value, onChange, label }) => {
    const { t } = useTranslation();

    return (
        <div className="tetrone-form-group">
            <label className="tetrone-form-label">{label}</label>
            <div className="tetrone-settings-group">
                <label className="tetrone-radio-label">
                    <input
                        type="radio"
                        name="gender"
                        value="1"
                        checked={Number(value) === 1}
                        onChange={onChange}
                        required
                    />
                    {t('common.male')}
                </label>

                <label className="tetrone-radio-label">
                    <input
                        type="radio"
                        name="gender"
                        value="2"
                        checked={Number(value) === 2}
                        onChange={onChange}
                        required
                    />
                    {t('common.female')}
                </label>
            </div>
        </div>
    );
};

export default GenderSelect;