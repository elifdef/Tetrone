import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';

export function useAuthForms() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { login } = useContext(AuthContext);

    const loginUser = async (loginParam, password) => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await AuthService.signIn(loginParam, password);
            if (res.success && res.data?.token) {
                login(res.data.token, res.data.user);
                
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
            }
        } catch (err) {
            let errorMessage = err.message || t('api.error.ERR_UNKNOWN');
            if (typeof errorMessage === 'object') {
                errorMessage = errorMessage.text || errorMessage.message || Object.values(errorMessage)[0] || "Login failed";
            }
            setError(String(errorMessage));
        } finally {
            setLoading(false);
        }
    };

    return { loginUser, loading, error, setError };
}