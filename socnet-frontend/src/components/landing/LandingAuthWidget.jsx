import { useState } from "react";
import { useTranslation } from "react-i18next";
import LoginForm from "../auth/LoginForm";
import RegisterForm from "../auth/RegisterForm";

export default function LandingAuthWidget() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("register");

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
                {activeTab === 'login' && <LoginForm />}
                {activeTab === 'register' && <RegisterForm />}
            </div>
        </div>
    );
}