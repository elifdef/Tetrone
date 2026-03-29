import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { APP_NAME } from "../config";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from "react-i18next";
import FeatureBlock from "../components/landing/FeatureBlock";
import StatsService from "../services/stats.service";
import "../styles/landing.css";

export default function IndexPage() {
    const { t } = useTranslation();
    usePageTitle();

    if (localStorage.getItem('token')) {
        return null;
    }

    const [stats, setStats] = useState({ users: 0, posts: 0, online: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const res = await StatsService.getLandingStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        };
        fetchStats();
    }, []);

    const features = t('main.landing_features', { returnObjects: true }) || [];

    return (
        <div className="tetrone-landing-root">
            <div className="tetrone-landing-container">
                <div className="tetrone-landing-left-col">
                    <div className="tetrone-landing-welcome-box">
                        <h1 className="tetrone-landing-welcome-title">
                            {t('main.landing_title', { name: APP_NAME })}
                        </h1>
                        <p className="tetrone-landing-welcome-text">
                            {t('main.landing_subtitle')}
                        </p>
                    </div>

                    <div className="tetrone-landing-features-list">
                        {Array.isArray(features) && features.map((feature, index) => {
                            const r = Math.floor(Math.random() * 256);
                            const g = Math.floor(Math.random() * 256);
                            const b = Math.floor(Math.random() * 256);
                            const randomColor = `rgb(${r}, ${g}, ${b})`;

                            return (
                                <FeatureBlock
                                    key={index}
                                    title={feature.title}
                                    description={feature.description}
                                    image={feature.image}
                                    imageAlt={feature.title}
                                    color={randomColor}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="tetrone-landing-right-col">
                    <div className="tetrone-landing-auth-panel">
                        <div className="tetrone-landing-auth-header">
                            {t('main.landing_join_header')}
                        </div>
                        <div className="tetrone-landing-auth-body">
                            <p className="tetrone-landing-auth-text">
                                {t('main.landing_join_desc')}
                            </p>
                            <Link to="/register" className="tetrone-landing-btn-primary">
                                {t('main.landing_signup_btn')}
                            </Link>
                            <Link to="/login" className="tetrone-landing-btn-secondary">
                                {t('main.landing_signin_btn')}
                            </Link>
                        </div>
                    </div>

                    <div className="tetrone-landing-stats-panel">
                        <div className="tetrone-landing-stats-header">
                            {t('main.landing_stats_title')}
                        </div>
                        <div className="tetrone-landing-stats-body">
                            <div className="tetrone-landing-stat-item">
                                <span className="tetrone-landing-stat-label">{t('main.landing_stats_users')}:</span>
                                <span className="tetrone-landing-stat-value">{stats.users}</span>
                            </div>
                            <div className="tetrone-landing-stat-item">
                                <span className="tetrone-landing-stat-label">{t('main.landing_stats_posts')}:</span>
                                <span className="tetrone-landing-stat-value">{stats.posts}</span>
                            </div>
                            <div className="tetrone-landing-stat-item">
                                <span className="tetrone-landing-stat-label">{t('main.landing_stats_online')}:</span>
                                <span className="tetrone-landing-stat-value tetrone-landing-stat-online">{stats.online}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}