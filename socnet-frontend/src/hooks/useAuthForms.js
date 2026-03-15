import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from 'react-i18next';

export const useAuthForms = () => {
    const { t } = useTranslation();
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loginUser = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const res = await AuthService.signIn(email, password);
            const token = res.token || res.data?.token;

            if (!token) {
                throw new Error("Token not received");
            }

            const user = await AuthService.getMe(token);

            login(token, user);

            navigate(!user.is_setup_complete ? '/setup-profile' : '/');

        } catch (err) {
            setError(err.data?.message || err.message || t('error.signin'));
        } finally {
            setLoading(false);
        }
    };

    const registerUser = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            await AuthService.signUp(formData);
            return true;
        } catch (err) {
            setError(err.data?.message || err.message || t('error.registration'));
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loginUser,
        registerUser,
        loading,
        error,
        setError
    };
};