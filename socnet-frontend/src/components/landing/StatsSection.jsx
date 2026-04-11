import { useTranslation } from "react-i18next";

export default function StatsSection({ stats }) {
    const { t } = useTranslation();

    return (
        <div className="tetrone-landing-stats-panel">
            <div className="tetrone-landing-stats-header">
                {t('main.landing_stats_title')}
            </div>
            <div className="tetrone-landing-stats-body">
                <div className="tetrone-landing-stat-item">
                    <span className="tetrone-landing-stat-label">{t('main.landing_stats_users')}:</span>
                    <b className="tetrone-landing-stat-value">{stats.users}</b>
                </div>
                <div className="tetrone-landing-stat-item">
                    <span className="tetrone-landing-stat-label">{t('main.landing_stats_posts')}:</span>
                    <b className="tetrone-landing-stat-value">{stats.posts}</b>
                </div>
                <div className="tetrone-landing-stat-item">
                    <span className="tetrone-landing-stat-label">{t('main.landing_stats_online')}:</span>
                    <b className="tetrone-landing-stat-online">{stats.online}</b>
                </div>
            </div>
        </div>
    );
}