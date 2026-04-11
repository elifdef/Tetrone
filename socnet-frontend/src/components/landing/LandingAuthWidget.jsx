import { useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LandingAuthWidget() {
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState("register");
    const [isLoading, setIsLoading] = useState(false);

    const [loginData, setLoginData] = useState({ login: "", password: "" });
    const [registerData, setRegisterData] = useState({
        username: "", email: "", password: "", password_confirmation: ""
    });

    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

    const onLoginSubmit = async (e) => {
        e.preventDefault();
        // Логіка входу
    };

    const onRegisterSubmit = async (e) => {
        e.preventDefault();
        // Логіка реєстрації
    };

    return (
        <div className="tetrone-auth-widget">
            <div className="tetrone-auth-widget-intro">
                <h1>{t('main.landing_join_header')}</h1>
                {t('main.landing_join_desc')}
            </div>

            <div className="tetrone-auth-tabs">
                <button
                    className={`tetrone-auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                    onClick={() => setActiveTab('register')}
                >
                    {t('auth.title_register')}
                </button>
                <button
                    className={`tetrone-auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                    onClick={() => setActiveTab('login')}
                >
                    {t('auth.title_login')}
                </button>
            </div>

            <div className="tetrone-auth-content">
                {activeTab === 'login' && (
                    <form onSubmit={onLoginSubmit} className="tetrone-auth-form">
                        <Input type="text" name="login" placeholder={t('auth.email_or_username')} value={loginData.login} onChange={handleLoginChange} required />
                        <Input type="password" name="password" placeholder={t('auth.password')} value={loginData.password} onChange={handleLoginChange} required />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('common.processing') : t('action.login')}
                        </Button>
                    </form>
                )}

                {activeTab === 'register' && (
                    <form onSubmit={onRegisterSubmit} className="tetrone-auth-form">
                        <Input type="text" name="username" placeholder={t('auth.username')} value={registerData.username} onChange={handleRegisterChange} required />
                        <Input type="email" name="email" placeholder={t('auth.email')} value={registerData.email} onChange={handleRegisterChange} required />
                        <Input type="password" name="password" placeholder={t('auth.password')} value={registerData.password} onChange={handleRegisterChange} required />
                        <Input type="password" name="password_confirmation" placeholder={t('auth.password_confirmation')} value={registerData.password_confirmation} onChange={handleRegisterChange} required />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? t('common.processing') : t('action.register')}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}