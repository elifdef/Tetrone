import { useSecuritySettings } from '../../hooks/useSecuritySettings';
import FormInput from '../../components/UI/FormInput';
import { notifyWarn } from "../../components/Notify";

const SecuritySettings = () => {
    const {
        user,
        email, setEmail,
        passwordForEmail, setPasswordForEmail,
        loadingEmail, handleUpdateEmail,
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        loadingPass, handleUpdatePassword
    } = useSecuritySettings();

    return (
        <>
            <div className="vk-settings-box">
                <strong>Зміна електронної пошти</strong>
                <div className="vk-settings-info-row">
                    <div className="vk-settings-info-item">
                        <span>Поточна електронна адреса:</span>
                        <span>{user?.email}</span>
                    </div>

                    <div className="vk-settings-info-item">
                        <span>Статус верифікації:</span>
                        <span style={{ color: user?.email_verified_at ? '#10b981' : '#f59e0b' }}>
                            {user?.email_verified_at ? "Підтверджено" : "Непідтверджено"}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleUpdateEmail} className="vk-settings-form">
                    <div className="vk-form-group">
                        <label className="vk-form-label">Нова електронна адреса</label>
                        <FormInput
                            type="email"
                            className="vk-form-input"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="new-email@example.com"
                        />
                    </div>

                    <div className="vk-form-group">
                        <label className="vk-form-label">Пароль акаунту</label>
                        <FormInput
                            type="password"
                            className="vk-form-input"
                            required
                            value={passwordForEmail}
                            onChange={(e) => setPasswordForEmail(e.target.value)}
                            placeholder="********"
                        />
                    </div>
                    <button
                        className="vk-btn-save"
                        type="submit"
                        disabled={loadingEmail}
                    >
                        {loadingEmail ? 'Зберігаємо...' : 'Змінити'}
                    </button>
                </form>
            </div>

            <div className="vk-settings-box">
                <strong>Зміна паролю</strong>
                <form onSubmit={handleUpdatePassword}>
                    <div className="vk-form-group">
                        <label className="vk-form-label">Поточний пароль</label>
                        <FormInput
                            type="password"
                            className="vk-form-input"
                            required
                            placeholder="********"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>

                    <div className="vk-form-group">
                        <label className="vk-form-label">Новий пароль (не менше 8 символів)</label>
                        <FormInput
                            type="password"
                            className="vk-form-input"
                            required
                            placeholder="********"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="vk-form-group">
                        <label className="vk-form-label">Підтвердіть новий пароль</label>
                        <FormInput
                            type="password"
                            className="vk-form-input"
                            required
                            placeholder="********"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="vk-btn-save"
                        disabled={loadingPass}
                    >
                        {loadingPass ? 'Зберігаємо...' : 'Змінити пароль'}
                    </button>
                </form>
            </div>

            <div className="vk-settings-danger">
                <div className="vk-settings-danger-header">Небезпечна зона</div>
                <div className="vk-settings-danger-body">
                    <div>
                        <h4>Видалити акаунт</h4>
                        <div className="vk-settings-quote">
                            - Ти це зробиш?<br />
                            - Так.<br />
                            - І якою ціною?<br />
                            - Ціною всього.
                        </div>
                    </div>
                    <button className="vk-btn-delete" onClick={() => notifyWarn('Не сьогодні')}>
                        Видалити акаунт
                    </button>
                </div>
            </div>
        </>
    );
};

export default SecuritySettings;