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
        <div className="socnet-settings-box">
            <strong>{t('settings.change_password')}</strong>
            <form onSubmit={onSubmit}>
                <div className="socnet-form-group">
                    <label className="socnet-form-label">{t('settings.current_password')}</label>
                    <Input
                        type="password"
                        className="socnet-form-input"
                        required
                        placeholder="********"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>

                <div className="socnet-form-group">
                    <label className="socnet-form-label">{t('settings.new_password')}</label>
                    <Input
                        type="password"
                        className="socnet-form-input"
                        required
                        placeholder="********"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="socnet-form-group">
                    <label className="socnet-form-label">{t('auth.password_confirmation')}</label>
                    <Input
                        type="password"
                        className="socnet-form-input"
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
                    className="socnet-btn-save"
                    disabled={loading || (newPassword && newPasswordScore < 5)}
                >
                    {loading ? t('common.saving') : t('common.save')}
                </button>
            </form>
        </div>
    );
};

export default PasswordChangeForm;