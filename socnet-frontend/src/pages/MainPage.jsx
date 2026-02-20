import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { APP_NAME } from "../config";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from 'react-i18next';

const FeatureBlock = ({ title, description, imageAlt, isReversed, color }) => (
    <div className={`socnet-feature-block ${isReversed ? 'reversed' : ''}`}>
        <div className="socnet-feature-text">
            <h2>{title}</h2>
            <p>{description}</p>
        </div>
        <div className="socnet-feature-visual" style={{ borderLeft: `3px solid ${color}` }}>
            <span style={{ color: color }}>[{imageAlt}]</span>
        </div>
    </div>
);

export default function MainPage() {
    const { t } = useTranslation();
    usePageTitle();
    const features = t('main.blocks', { returnObjects: true });

    return (
        <div className="socnet-landing-wrapper">
            <header className="socnet-landing-hero">
                <h1 className="socnet-landing-title">
                    {t('main.title', { name: APP_NAME })}
                </h1>
                <p className="socnet-landing-subtitle">
                    {t('main.subtitle')}
                </p>
                <div className="socnet-landing-actions">
                    <Link to="/register" className="socnet-btn socnet-landing-btn-big">
                        {t('main.join.signup_btn')}
                    </Link>
                    <Link to="/login" className="socnet-btn socnet-landing-btn-big" style={{ background: 'transparent', color: 'var(--theme-link)' }}>
                        {t('main.join.signin_btn')}
                    </Link>
                </div>
            </header>

            <div className="socnet-landing-features">
                {features.map((feature, index) => (
                    <FeatureBlock
                        key={index}
                        title={feature.title}
                        description={feature.description}
                        imageAlt={feature.img_alt}
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

            <div className="socnet-cta-block">
                <h2 style={{ fontSize: '16px', color: 'var(--theme-text-main)', marginBottom: '10px' }}>
                    {t('main.join.header')}
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '20px' }}>
                    {t('main.join.description')}
                </p>

                <div className="socnet-landing-actions">
                    <Link to="/register" className="socnet-btn socnet-landing-btn-big">
                        {t('main.join.signup_btn')}
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}