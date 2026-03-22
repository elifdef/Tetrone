import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { APP_NAME } from "../../config";
import "flag-icons/css/flag-icons.min.css";

const SUPPORTED_LANGUAGES = [
    { code: 'uk', countryCode: 'ua', name: 'Українська' },
    { code: 'en', countryCode: 'gb', name: 'English' },
];

export default function Footer() {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
    };

    const isActive = (lang) => i18n.language.startsWith(lang);

    return (
        <footer className="tetrone-footer">
            <div className="tetrone-footer-row">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <span
                        key={lang.code}
                        className={`tetrone-lang-btn ${isActive(lang.code) ? 'active' : ''}`}
                        onClick={() => changeLanguage(lang.code)}
                        title={lang.name}
                    >
                        <span className={`fi fi-${lang.countryCode}`}></span>
                    </span>
                ))}
            </div>

            <div className="tetrone-footer-row">
                <Link to="/rules" className="tetrone-footer-link">
                    {t('common.rules')}
                </Link>
                <Link to="https://github.com/elifdef/social-network" className="tetrone-footer-link">
                    Github
                </Link>
                <Link to="/developers" className="tetrone-footer-link">
                    {t('footer.for_dev')}
                </Link>
            </div>

            <div className="tetrone-footer-row">
                <span className="tetrone-footer-text">
                    {APP_NAME} © 2025 - 2026. {t('footer.text')}
                </span>
            </div>

        </footer>
    );
}