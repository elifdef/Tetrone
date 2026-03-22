import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { APP_NAME } from "../config";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from "react-i18next";
import FeatureBlock from "../components/landing/FeatureBlock";

export default function MainPage() {
    const { t } = useTranslation();
    usePageTitle();
    const features = [
        {
            id: 'share',
            file: 'moments.png',
            translationKey: 'main.blocks.share'
        },
        {
            id: 'connect',
            file: 'post.png',
            translationKey: 'main.blocks.connect'
        },
        {
            id: 'personalize',
            file: 'personalize.png',
            translationKey: 'main.blocks.personalize'
        },
        {
            id: 'friends',
            file: 'friends.png',
            translationKey: 'main.blocks.friends'
        }
    ];

    return (
        <div className="tetrone-landing-wrapper">
            <header className="tetrone-landing-hero">
                <h1 className="tetrone-landing-title">
                    {t('main.title', { name: APP_NAME })}
                </h1>
                <p className="tetrone-landing-subtitle">
                    {t('main.subtitle')}
                </p>
                <div className="tetrone-landing-actions">
                    <Link to="/register" className="tetrone-btn tetrone-landing-btn-big">
                        {t('main.join.signup_btn')}
                    </Link>
                    <Link to="/login" className="tetrone-btn tetrone-btn-ghost tetrone-landing-btn-big">
                        {t('main.join.signin_btn')}
                    </Link>
                </div>
            </header>

            <div className="tetrone-landing-features">
                {features.map((feature, index) => (
                    <FeatureBlock
                        key={index}
                        title={t(`${feature.translationKey}.title`)}
                        description={t(`${feature.translationKey}.description`)}
                        image={feature.file}
                        imageAlt={t(`${feature.translationKey}.title`)}
                        isReversed={index % 2 !== 0}
                        color={(() => {
                            const r = Math.floor(Math.random() * 256);
                            const g = Math.floor(Math.random() * 256);
                            const b = Math.floor(Math.random() * 256);
                            return `rgb(${r}, ${g}, ${b})`
                        })()}
                    />
                ))}
            </div>

            <div className="tetrone-cta-block">
                <h2 className="tetrone-cta-title">
                    {t('main.join.header')}
                </h2>
                <p className="tetrone-cta-desc">
                    {t('main.join.description')}
                </p>

                <div className="tetrone-landing-actions">
                    <Link to="/register" className="tetrone-btn tetrone-landing-btn-big">
                        {t('main.join.signup_btn')}
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}