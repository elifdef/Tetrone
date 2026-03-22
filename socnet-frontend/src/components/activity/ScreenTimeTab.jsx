import { useState, useEffect } from 'react';
import ActivityService from '../../services/activity.service';
import { useTranslation } from 'react-i18next';

export default function ScreenTimeTab() {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ total_active_seconds: 0, history: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        ActivityService.getScreenTime().then(res => {
            if (res.success) {
                setStats(res.data);
            } else {
                console.error("Failed to fetch screen time stats:", res.message);
            }
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const interval = setInterval(() => {
            // рахуємо тільки якщо користувач реально зараз на цій вкладці
            if (document.visibilityState === 'visible') {
                setStats(prev => {
                    const todayDate = new Date().toISOString().split('T')[0];
                    let isTodayFound = false;

                    const newHistory = prev.history.map(day => {
                        if (day.date === todayDate) {
                            isTodayFound = true;
                            return { ...day, seconds: day.seconds + 1 };
                        }
                        return day;
                    });

                    // якщо користувач зайшов рівно опівночі і запису за сьогодні ще не було
                    if (!isTodayFound) {
                        newHistory.unshift({ date: todayDate, seconds: 1 });
                    }

                    return {
                        ...prev,
                        total_active_seconds: prev.total_active_seconds + 1,
                        history: newHistory
                    };
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLoading]);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let result = '';
        if (hours > 0) {
            result += `${hours} ${t('common.hours_short')} `;
        }
        if (minutes > 0 || hours > 0) {
            result += `${minutes} ${t('common.minutes_short')} `;
        }
        result += `${seconds} ${t('common.seconds_short')}`;

        return result.trim();
    };

    if (isLoading) {
        return <div className="tetrone-loading">{t('common.loading')}</div>;
    }

    return (
        <div className="tetrone-settings-regular">
            <div className="tetrone-stats-header">
                <h3 className="tetrone-stats-subtitle">{t('activity.stats.total_time')}</h3>
                <div className="tetrone-stats-total">
                    {formatTime(stats.total_active_seconds)}
                </div>
                <p className="tetrone-stats-desc">
                    {t('activity.stats.description')}
                </p>
            </div>

            <h4 className="tetrone-section-title">{t('activity.stats.history')}</h4>

            {stats.history.length === 0 ? (
                <div className="tetrone-empty-state">{t('activity.stats.empty')}</div>
            ) : (
                <div className="tetrone-stats-list">
                    {stats.history.map((day, index) => (
                        <div key={index} className="tetrone-stats-item">
                            <span className="tetrone-stats-date">{day.date}</span>
                            <span className="tetrone-stats-time">{formatTime(day.seconds)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}