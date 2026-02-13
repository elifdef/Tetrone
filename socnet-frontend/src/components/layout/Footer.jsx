import { useTranslation } from 'react-i18next';
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
        <footer className="vk-footer">
            <div className="vk-footer-languages">
                {SUPPORTED_LANGUAGES.map((lang, index) => (
                    <div key={lang.code} className="vk-footer-lang-item">
                        <span
                            className={`vk-lang-btn ${isActive(lang.code) ? 'active' : ''}`}
                            onClick={() => changeLanguage(lang.code)}
                            title={lang.name}
                        >
                            <span className={`fi fi-${lang.countryCode}`}></span>
                        </span>
                        {index < SUPPORTED_LANGUAGES.length - 1 && (
                            <span className="vk-lang-separator">|</span>
                        )}
                    </div>
                ))}
                <span className="vk-lang-separator">|</span>

                <span className="vk-lang-all">
                    all languages »
                </span>
            </div>
            <div className="vk-footer-copyright">
                © 2025 - 2026 {APP_NAME}. {t('footer.text')}
            </div>
        </footer>
    );
}