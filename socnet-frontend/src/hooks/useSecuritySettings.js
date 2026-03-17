import { useState, useContext } from 'react';
import UserService from '../services/user.service';
import { AuthContext } from '../context/AuthContext';
import { notifyError, notifySuccess } from "../components/common/Notify";
import { useTranslation } from 'react-i18next';

export const useSecuritySettings = () => {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);

    const [email, setEmail] = useState(user?.email || '');
    const [passwordForEmail, setPasswordForEmail] = useState('');
    const [loadingEmail, setLoadingEmail] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPass, setLoadingPass] = useState(false);

    const handleUpdateEmail = async (e) => {
        e.preventDefault();

        if (!passwordForEmail) {
            notifyError(t('error.enter_confirm_password'));
            return;
        }

        setLoadingEmail(true);

        const res = await UserService.updateEmail(email, passwordForEmail);

        if (res.success) {
            setUser(prev => ({ ...prev, email: email, email_verified_at: null }));
            setPasswordForEmail('');
            notifySuccess(res.message);
        } else {
            if (res.status === 422 && res.data?.errors?.email) {
                notifyError(res.data.errors.email[0]);
            } else if (res.status === 403) {
                notifyError(t('api.error.ERR_INVALID_PASSWORD'));
            } else {
                notifyError(res.message);
            }
        }
        setLoadingEmail(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return notifyError(t('error.not_match_password'));
        }

        setLoadingPass(true);

        const res = await UserService.updatePassword(currentPassword, newPassword, confirmPassword);

        if (res.success) {
            notifySuccess(res.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            const errors = res.data?.errors || {};
            if (errors.current_password) {
                notifyError(errors.current_password[0]);
            } else if (errors.password) {
                notifyError(errors.password[0]);
            } else {
                notifyError(res.message);
            }
        }
        setLoadingPass(false);
    };

    return {
        user, email, setEmail, passwordForEmail, setPasswordForEmail,
        loadingEmail, handleUpdateEmail,
        currentPassword, setCurrentPassword, newPassword, setNewPassword,
        confirmPassword, setConfirmPassword, loadingPass, handleUpdatePassword, t
    };
};