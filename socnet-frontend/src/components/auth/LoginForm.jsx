import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthForms } from "./hooks/useAuthForms";
import { useTranslation } from 'react-i18next';
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
    const { t } = useTranslation();
    const { loginUser, loading, error, setError } = useAuthForms();

    const [formData, setFormData] = useState({
        login: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        loginUser(formData.login, formData.password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                type="text"
                name="login"
                id="login-id"
                label={t('auth.email_or_username')}
                autoComplete="username"
                value={formData.login}
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

            <Button
                disabled={loading}
            >
                {loading ? t('common.loading') : t('auth.signin')}
            </Button>

            <div className="tetrone-auth-footer">
                {t('auth.not_have_account')} <Link to="/register" className="tetrone-link">{t('auth.signup')}</Link>
            </div>
        </form>
    );
}