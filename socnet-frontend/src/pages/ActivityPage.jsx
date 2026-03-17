import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import fetchClient from '../api/client';
import LikedPostsTab from '../components/activity/LikedPostsTab';
import MyCommentsTab from '../components/activity/MyCommentsTab';
import MyRepostsTab from '../components/activity/MyRepostsTab';
import ScreenTimeTab from '../components/activity/ScreenTimeTab';
import { usePageTitle } from '../hooks/usePageTitle';
import { notifyError } from '../components/common/Notify';

export default function ActivityPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Отримуємо вкладку з URL (дефолтна: 'likes')
    const activeTab = searchParams.get('tab') || 'likes';
    const [counts, setCounts] = useState({ likes: 0, comments: 0, reposts: 0 });

    const getPageTitle = () => {
        const baseTitle = t('common.my_activity');
        switch (activeTab) {
            case 'likes': return `${baseTitle} | ${t('common.likes')}`;
            case 'comments': return `${baseTitle} | ${t('common.comments')}`;
            case 'reposts': return `${baseTitle} | ${t('common.reposts')}`;
            case 'stats': return `${baseTitle} | ${t('activity.stats.title')}`;
            default: return baseTitle;
        }
    };

    usePageTitle(getPageTitle());

    useEffect(() => {
        fetchClient('/activity/counts').then(res => {
            if (res.success) {
                setCounts(res.data);
            } else {
                console.error("Failed to fetch activity counts:", res.message);
                notifyError(res.message);
            }
        });
    }, []);

    const updateCount = useCallback((type, delta) => {
        setCounts(prev => ({
            ...prev,
            [type]: Math.max(0, prev[type] + delta)
        }));
    }, []);

    const handleTabChange = (newTab) => {
        setSearchParams({ tab: newTab });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'likes':
                return <LikedPostsTab onCountUpdate={(delta) => updateCount('likes', delta)} />;
            case 'comments':
                return <MyCommentsTab onCountUpdate={(delta) => updateCount('comments', delta)} />;
            case 'reposts':
                return <MyRepostsTab onCountUpdate={(delta) => updateCount('reposts', delta)} />;
            case 'stats':
                return <ScreenTimeTab />;
            default:
                return <div className="socnet-empty-state">{t('error.page_not_found')}</div>;
        }
    };

    return (
        <div className="socnet-card-wrapper">
            <h1 className="socnet-section-title">
                {t('common.my_activity')}
            </h1>

            <div className="socnet-tabs">
                <button
                    onClick={() => handleTabChange('likes')}
                    className={`socnet-tab ${activeTab === 'likes' ? 'active' : ''}`}
                >
                    {t('common.likes')}
                    <span className="socnet-tab-count">({counts.likes})</span>
                </button>

                <button
                    onClick={() => handleTabChange('comments')}
                    className={`socnet-tab ${activeTab === 'comments' ? 'active' : ''}`}
                >
                    {t('common.comments')}
                    <span className="socnet-tab-count">({counts.comments})</span>
                </button>

                <button
                    onClick={() => handleTabChange('reposts')}
                    className={`socnet-tab ${activeTab === 'reposts' ? 'active' : ''}`}
                >
                    {t('common.reposts')}
                    <span className="socnet-tab-count">({counts.reposts})</span>
                </button>

                <button
                    onClick={() => handleTabChange('stats')}
                    className={`socnet-tab ${activeTab === 'stats' ? 'active' : ''}`}
                >
                    {t('activity.stats.title')}
                </button>
            </div>

            <div className="socnet-activity-content">
                {renderContent()}
            </div>
        </div>
    );
}