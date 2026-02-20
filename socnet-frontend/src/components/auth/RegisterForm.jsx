import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useTranslation } from 'react-i18next';
import Input from "../UI/Input";
import PasswordStrengthBar from "../UI/PasswordStrengthBar";
export default function RegisterForm() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password_confirmation: ""
    });

    const [msg, setMsg] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [passwordScore, setPasswordScore] = useState(0);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwordScore < 5) {
            setMsg({ text: t('auth.password_too_weak'), type: "error" });
            return;
        }

        setMsg({});
        setLoading(true);

        try {
            await api.post('/sign-up', formData);
            setMsg({
                text: (
                    <span>
                        {t('auth.you_have_registered')}<br />
                        <Link to="/login" className="socnet-link" style={{ fontWeight: 'bold' }}>{t('auth.signin')}</Link>
                    </span>
                ),
                type: "success"
            });
            setFormData({ username: "", email: "", password: "", password_confirmation: "" });
        } catch (err) {
            const errorText = err.response?.data?.message || t('error.registration');
            setMsg({ text: errorText, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (msg.type === "success") {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className="socnet-auth-msg success" style={{ border: 'none', background: 'transparent' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}></div>
                    {msg.text}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
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

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
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

                <div style={{ flex: 1 }}>
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
                <div className="socnet-auth-msg error">
                    {msg.text}
                </div>
            )}

            <button
                className="socnet-btn"
                type="submit"
                disabled={loading || (formData.password && passwordScore < 5)}
                style={{ width: '100%', marginTop: '10px' }}
            >
                {loading ? t('common.loading') : t('auth.signup')}
            </button>

            <div className="socnet-auth-footer">
                {t('auth.already_have_account')} <Link to="/login" className="socnet-link">{t('auth.signin')}</Link>
            </div>
        </form>
    );
}