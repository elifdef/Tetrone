import { useState, useEffect } from 'react';
import fetchClient from '../../api/client';
import { useTranslation } from 'react-i18next';

export default function ScreenTimeTab() {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ total_active_seconds: 0, history: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchClient('/activity/screen-time')
            .then(data => setStats(data))
            .catch(err => console.error("Failed to fetch screen time stats", err))
            .finally(() => setIsLoading(false));
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
        return <div className="socnet-loading">{t('common.loading')}</div>;
    }

    return (
        <div className="socnet-settings-regular">
            <div className="socnet-stats-header">
                <h3 className="socnet-stats-subtitle">{t('activity.stats.total_time')}</h3>
                <div className="socnet-stats-total">
                    {formatTime(stats.total_active_seconds)}
                </div>
                <p className="socnet-stats-desc">
                    {t('activity.stats.description')}
                </p>
            </div>

            <h4 className="socnet-section-title">{t('activity.stats.history')}</h4>
            
            {stats.history.length === 0 ? (
                <div className="socnet-empty-state">{t('activity.stats.empty')}</div>
            ) : (
                <div className="socnet-stats-list">
                    {stats.history.map((day, index) => (
                        <div key={index} className="socnet-stats-item">
                            <span className="socnet-stats-date">{day.date}</span>
                            <span className="socnet-stats-time">{formatTime(day.seconds)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}