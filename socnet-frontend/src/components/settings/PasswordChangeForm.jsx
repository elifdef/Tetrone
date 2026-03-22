import React, { useState } from 'react';
import Input from '../UI/Input';
import PasswordStrengthBar from '../UI/PasswordStrengthBar';

const PasswordChangeForm = ({
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    loading, onSubmit, t
}) => {
    const [newPasswordScore, setNewPasswordScore] = useState(0);

    return (
        <div className="tetrone-settings-box">
            <strong>{t('settings.change_password')}</strong>
            <form onSubmit={onSubmit}>
                <div className="tetrone-form-group">
                    <label className="tetrone-form-label">{t('settings.current_password')}</label>
                    <Input
                        type="password"
                        className="tetrone-form-input"
                        required
                        placeholder="********"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>

                <div className="tetrone-form-group">
                    <label className="tetrone-form-label">{t('settings.new_password')}</label>
                    <Input
                        type="password"
                        className="tetrone-form-input"
                        required
                        placeholder="********"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="tetrone-form-group">
                    <label className="tetrone-form-label">{t('auth.password_confirmation')}</label>
                    <Input
                        type="password"
                        className="tetrone-form-input"
                        required
                        placeholder="********"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <PasswordStrengthBar
                    password={newPassword}
                    onScoreChange={setNewPasswordScore}
                />

                <button
                    type="submit"
                    className="tetrone-btn-save"
                    disabled={loading || (newPassword && newPasswordScore < 5)}
                >
                    {loading ? t('common.saving') : t('common.save')}
                </button>
            </form>
        </div>
    );
};

export default PasswordChangeForm;