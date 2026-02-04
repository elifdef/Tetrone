import Footer from "../components/layout/Footer";
import LoginForm from "../components/auth/LoginForm";
import { usePageTitle } from "../hooks/usePageTitle";

export default function LoginPage() {
    usePageTitle("Вхід");
    return (
        <>
            <div className="auth-container">
                <h1>Вхід</h1>
                <LoginForm />
            </div>
            <Footer />
        </>
    );
}