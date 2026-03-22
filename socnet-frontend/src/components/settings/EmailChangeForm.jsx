import Input from '../UI/Input';

const EmailChangeForm = ({
    user,
    email, setEmail,
    passwordForEmail, setPasswordForEmail,
    loading, onSubmit, t
}) => {
    const isVerified = Boolean(user?.email_verified_at);

    return (
        <div className="tetrone-settings-box">
            <strong>{t('settings.change_email')}</strong>

            <div className="tetrone-settings-info-row">
                <div className="tetrone-settings-info-item">
                    <span>{t('settings.current_email')}:</span>
                    <span>{user?.email}</span>
                </div>

                <div className="tetrone-settings-info-item">
                    <span>{t('settings.verification_status')}:</span>
                    <span className={isVerified ? 'tetrone-text-success' : 'tetrone-text-warning'}>
                        {t(`common.${isVerified ? 'confirmed' : 'unconfirmed'}`)}
                    </span>
                </div>
            </div>

            <form onSubmit={onSubmit} className="tetrone-settings-form">
                <div className="tetrone-form-group">
                    <label className="tetrone-form-label">{t('settings.new_email')}</label>
                    <Input
                        type="email"
                        className="tetrone-form-input"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="NewEmail@example.com"
                    />
                </div>

                <div className="tetrone-form-group">
                    <label className="tetrone-form-label">{t('settings.account_password')}</label>
                    <Input
                        type="password"
                        className="tetrone-form-input"
                        required
                        value={passwordForEmail}
                        onChange={(e) => setPasswordForEmail(e.target.value)}
                        placeholder="********"
                    />
                </div>
                <button
                    className="tetrone-btn-save"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? t('common.saving') : t('common.change')}
                </button>
            </form>
        </div>
    );
};

export default EmailChangeForm;