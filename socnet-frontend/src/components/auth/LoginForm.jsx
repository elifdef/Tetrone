import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthForms } from "./hooks/useAuthForms";
import { useTranslation } from 'react-i18next';
import Input from "../UI/Input";

export default function LoginForm() {
    const { t } = useTranslation();
    const { loginUser, loading, error, setError } = useAuthForms();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        loginUser(formData.email, formData.password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                type="email"
                name="email"
                id="login-email"
                label={t('auth.email')}
                autoComplete="username"
                value={formData.email}
                onChange={handleChange}
                required
            />

            <Input
                type="password"
                name="password"
                id="login-password"
                label={t('auth.password')}
                placeholder=""
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                required
            />

            {error && (
                <div className="tetrone-auth-msg error">
                    {error}
                </div>
            )}

            <button
                className="tetrone-btn tetrone-btn-block"
                disabled={loading}
            >
                {loading ? t('common.loading') : t('auth.signin')}
            </button>

            <div className="tetrone-auth-footer">
                {t('auth.not_have_account')} <Link to="/register" className="tetrone-link">{t('auth.signup')}</Link>
            </div>
        </form>
    );
}