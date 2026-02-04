import Footer from "../components/layout/Footer";
import RegisterForm from "../components/auth/RegisterForm";
import { usePageTitle } from "../hooks/usePageTitle";

export default function RegisterPage() {
    usePageTitle("Реєстрація");
    return (
        <>
            <div className="auth-container">
                <h1>Реєстрація</h1>
                <RegisterForm />
            </div>
            <Footer />
        </>
    );
}