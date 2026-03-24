import { useSecuritySettings } from './hooks/useSecuritySettings';
import EmailChangeForm from './EmailChangeForm';
import PasswordChangeForm from './PasswordChangeForm';
import DangerZone from './DangerZone';

const SecuritySettings = () => {
    const {
        user,
        email, setEmail,
        passwordForEmail, setPasswordForEmail,
        loadingEmail, handleUpdateEmail,
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        loadingPass, handleUpdatePassword, t
    } = useSecuritySettings();

    return (
        <>
            <EmailChangeForm
                user={user}
                email={email}
                setEmail={setEmail}
                passwordForEmail={passwordForEmail}
                setPasswordForEmail={setPasswordForEmail}
                loading={loadingEmail}
                onSubmit={handleUpdateEmail}
                t={t}
            />

            <PasswordChangeForm
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                loading={loadingPass}
                onSubmit={handleUpdatePassword}
                t={t}
            />

            <DangerZone t={t} />
        </>
    );
};

export default SecuritySettings;