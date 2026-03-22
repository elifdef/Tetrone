import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import AuthService from "../../services/auth.service";
import Input from "../UI/Input";
import PasswordStrengthBar from "../UI/PasswordStrengthBar";

export default function RegisterForm() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ username: "", email: "", password: "", password_confirmation: "" });
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [passwordScore, setPasswordScore] = useState(0);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwordScore < 5) {
            setMsg({ text: t('auth.password_too_weak'), type: "error" });
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setMsg({ text: t('auth.password_not_match'), type: "error" });
            return;
        }

        setMsg({ text: "", type: "" });
        setLoading(true);

        const res = await AuthService.signUp(formData);

        if (res.success) {
            setMsg({
                text: (
                    <span className="tetrone-auth-success-text">
                        {res.message || t('auth.you_have_registered')}<br />
                        <Link to="/login" className="tetrone-link tetrone-auth-msg-link">
                            {t('auth.signin')}
                        </Link>
                    </span>
                ),
                type: "success"
            });
            setFormData({ username: "", email: "", password: "", password_confirmation: "" });
        } else {
            setMsg({ text: res.message || t('error.registration'), type: "error" });
        }

        setLoading(false);
    };

    if (msg.type === "success") {
        return (
            <div className="tetrone-auth-success-wrapper">
                <div className="tetrone-auth-msg success tetrone-auth-success-hero">
                    <div className="tetrone-auth-success-icon" />
                    <div className="tetrone-auth-success-content">
                        {msg.text}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="tetrone-auth-form">
            <Input
                type="text"
                name="username"
                id="reg-username"
                label={t('auth.username')}
                value={formData.username}
                onChange={handleChange}
                autoComplete="off"
                required
            />

            <Input
                type="email"
                name="email"
                id="reg-email"
                label={t('auth.email')}
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
                required
            />

            <div className="tetrone-form-row">
                <div className="tetrone-form-group">
                    <Input
                        type="password"
                        name="password"
                        id="reg-password"
                        label={t('auth.password')}
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                    />
                </div>

                <div className="tetrone-form-group">
                    <Input
                        type="password"
                        name="password_confirmation"
                        id="reg-confirm"
                        label={t('auth.password_confirmation')}
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                    />
                </div>
            </div>

            <PasswordStrengthBar
                password={formData.password}
                onScoreChange={setPasswordScore}
            />

            {msg.type === "error" && (
                <div className="tetrone-auth-msg error">
                    {msg.text}
                </div>
            )}

            <button
                className="tetrone-btn tetrone-btn-block"
                type="submit"
                disabled={loading || (formData.password && passwordScore < 5)}
            >
                {loading ? t('common.loading') : t('auth.signup')}
            </button>

            <div className="tetrone-auth-footer">
                {t('auth.already_have_account')}{' '}
                <Link to="/login" className="tetrone-link">
                    {t('auth.signin')}
                </Link>
            </div>
        </form>
    );
}