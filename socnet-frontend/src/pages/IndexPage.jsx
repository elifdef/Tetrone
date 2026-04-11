import { useState, useEffect } from "react";
import Footer from "../components/layout/Footer";
import { APP_NAME } from "../config";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTranslation } from "react-i18next";
import FeatureBlock from "../components/landing/FeatureBlock";
import StatsService from "../services/stats.service";
import LandingAuthWidget from "../components/landing/LandingAuthWidget";
import RecentUsersSection from "../components/landing/RecentUsersSection";
import "../styles/landing.css";

export default function IndexPage() {
    const { t } = useTranslation();
    usePageTitle();

    if (localStorage.getItem('token')) {
        return null;
    }

    const [stats, setStats] = useState({ users: 0, posts: 0, online: 0 });
    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const [statsRes, usersRes] = await Promise.all([
                StatsService.getLandingStats(),
                StatsService.getRecentUsers()
            ]);

            if (statsRes?.success && statsRes?.data) setStats(statsRes.data);
            if (usersRes?.success && usersRes?.data) setRecentUsers(usersRes.data);
        };
        fetchData();
    }, []);
    
    // eslint-disable-next-line i18next/no-literal-string
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
                    <LandingAuthWidget />

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

                    <RecentUsersSection users={recentUsers} />
                </div>
            </div>
            <Footer />
        </div>
    );
}