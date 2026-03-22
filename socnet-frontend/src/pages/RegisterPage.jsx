import Footer from "../components/layout/Footer";
import RegisterForm from "../components/auth/RegisterForm";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
    const { t } = useTranslation();
    usePageTitle(t('auth.signup'));

    return (
        <div className="tetrone-fullscreen-center">
            <div className="tetrone-auth-card">
                <div className="tetrone-auth-header">
                    <h1 className="tetrone-auth-title">{t('auth.signup')}</h1>
                </div>
                <RegisterForm />
            </div>
            <Footer />
        </div>
    );
}