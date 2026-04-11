import Footer from "../components/layout/Footer";
import LoginForm from "../components/auth/LoginForm";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const { t } = useTranslation();
    usePageTitle(t('action.login'));

    return (
        <div className="tetrone-fullscreen-center">
            <div className="tetrone-auth-card">
                <div className="tetrone-auth-header">
                    <h1 className="tetrone-auth-title">{t('action.login')}</h1>
                </div>
                <LoginForm />
            </div>
            <Footer />
        </div>
    );
}