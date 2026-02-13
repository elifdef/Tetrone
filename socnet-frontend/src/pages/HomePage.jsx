import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { usePageTitle } from "../hooks/usePageTitle";
import PostItem from "../components/post/PostItem";
import { mapPost } from "../services/mappers";
import { notifyError } from "../components/Notify";
import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

export default function HomePage() {
    const { t } = useTranslation();
    usePageTitle(t('common.posts'));
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'feed';
    const [error, setError] = useState(false);
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const abortControllerRef = useRef(null);

    const handleTabChange = (tab) => {
        if (activeTab === tab) return;

        setLoading(true);
        setPosts([]);
        setError(false);
        setPage(1);
        setHasMore(true);
        setSearchParams({ tab });
    };

    useEffect(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const newController = new AbortController();
        abortControllerRef.current = newController;

        const fetchFeed = async () => {
            try {
                setError(false);
                if (page === 1) setLoading(true);
                else setIsLoadingMore(true);

                const endpoint = activeTab === 'global' ? '/feed/global' : '/feed';
                const res = await api.get(`${endpoint}?page=${page}`, { signal: newController.signal });

                const newPosts = res.data.data.map(mapPost);
                const meta = res.data.meta;

                setPosts(prev => {
                    // якщо це перша сторінка - просто ставимо нові пости
                    if (page === 1) return newPosts;

                    // якщо це наступні сторінки - фільтруємо ті що вже є
                    const uniqueNewPosts = newPosts.filter(
                        newPost => !prev.some(existingPost => existingPost.id === newPost.id)
                    );

                    return [...prev, ...uniqueNewPosts];
                });

                setHasMore(meta.current_page < meta.last_page);

            } catch (err) {
                if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
                    setError(true);
                    if (page === 1) notifyError(t('error.loading', { resource: "feed" }));
                }
            } finally {
                if (!newController.signal.aborted) {
                    setLoading(false);
                    setIsLoadingMore(false);
                }
            }
        };

        fetchFeed();
        return () => newController.abort();
    }, [activeTab, page]);

    const loadMore = useCallback(() => {
        if (!loading && !isLoadingMore && hasMore && !error) {
            setIsLoadingMore(true); // блокуємо повторні виклики
            setPage(prev => prev + 1);
        }
    }, [loading, isLoadingMore, hasMore, error]);

    const loaderRef = useIntersectionObserver(loadMore, hasMore, isLoadingMore);

    const EmptyState = () => (
        <div className="vk-feed-empty">
            <h3>{t('common.welcome')}!</h3>
            {activeTab === 'feed' ? (
                <>
                    <p>{t('feed.my_feed_empty')}</p>
                    <div className="vk-feed-actions">
                        <Link to="/friends?tab=all" className="vk-btn-small" style={{ textDecoration: 'none', color: '#fff' }}>
                            {t('feed.find_friends')}
                        </Link>
                        <button className="vk-btn-small" onClick={() => handleTabChange('global')}>
                            {t('feed.watch_global_feed')}
                        </button>
                    </div>
                </>
            ) : (
                <p>{t('feed.global_feed_empty')}</p>
            )}
        </div>
    );

    const ErrorStateUI = () => (
        <div className="vk-feed-empty">
            <h3>{t('error.connection')}</h3>
            <p>{t('error.loading_post')}</p>
            <div className="vk-feed-actions">
                <button className="vk-btn-small" onClick={() => window.location.reload()}>
                    {t('common.reload_page')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="vk-feed-page">
            <div className="vk-feed-tabs">
                <button
                    className={`vk-feed-tab ${activeTab === 'feed' ? 'active' : ''}`}
                    onClick={() => handleTabChange('feed')}>
                    {t('feed.my_feed')}
                </button>
                <button
                    className={`vk-feed-tab ${activeTab === 'global' ? 'active' : ''}`}
                    onClick={() => handleTabChange('global')}>
                    {t('feed.global_feed')}
                </button>
            </div>

            {loading && page === 1 ? (
                <div className="vk-feed-loading">
                    {t('common.loading')}...
                </div>
            ) : (
                <div className="vk-feed-list">
                    {error && page === 1 ? (
                        <ErrorStateUI />
                    ) : posts.length > 0 ? (
                        <>
                            {posts.map(post => (
                                <PostItem key={post.id} post={post} />
                            ))}

                            {hasMore && !error && (
                                <div ref={loaderRef} style={{ padding: '20px', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
                                    {isLoadingMore ? t('common.loading') + '...' : ''}
                                </div>
                            )}

                            {!hasMore && (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--theme-text-muted)', fontSize: '11px' }}>
                                    {t('wall.no_posts')}
                                </div>
                            )}

                            {error && page > 1 && (
                                <div style={{ padding: '10px', textAlign: 'center' }}>
                                    <span style={{ color: '#bd4c4c', fontSize: '12px' }}>{t('error.connection')}</span>
                                    <br />
                                    <button className="vk-btn-small" style={{ marginTop: '5px' }} onClick={() => fetchFeed()}>
                                        Спробувати ще раз
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}
        </div>
    );
}