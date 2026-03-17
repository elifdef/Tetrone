import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FeedService from "../services/feed.service";
import { usePageTitle } from "../hooks/usePageTitle";
import PostItem from "../components/post/PostItem";
import { notifyError } from "../components/common/Notify";
import { useTranslation } from 'react-i18next';
import InfiniteScrollList from "../components/common/InfiniteScrollList";
import { AuthContext } from "../context/AuthContext";

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
    const { user: authUser } = useContext(AuthContext);

    const handleTabChange = (tab) => {
        if (activeTab === tab) return;
        setLoading(true);
        setPosts([]);
        setError(false);
        setPage(1);
        setHasMore(true);
        setSearchParams({ tab });
    };

    const fetchFeed = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const newController = new AbortController();
        abortControllerRef.current = newController;

        setError(false);
        if (page === 1) setLoading(true);
        else setIsLoadingMore(true);

        const res = await FeedService.getFeed(activeTab, page, newController.signal);

        if (!newController.signal.aborted) {
            if (res.success) {
                const items = res.data || [];
                const meta = res.meta;

                setPosts(prev => {
                    if (page === 1) return items;
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNewPosts = items.filter(newPost => !existingIds.has(newPost.id));
                    return [...prev, ...uniqueNewPosts];
                });
                setHasMore(meta ? meta.current_page < meta.last_page : false);
            } else {
                setError(true);
                if (page === 1) notifyError(res.message || t('error.load_feed'));
            }
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        }
    }, [activeTab, page]);

    const loadMore = useCallback(() => {
        if (!loading && !isLoadingMore && hasMore && !error) {
            setPage(prev => prev + 1);
        }
    }, [loading, isLoadingMore, hasMore, error]);

    const EmptyState = () => (
        <div className="socnet-empty-state with-card">
            <h3>{t('common.welcome')}!</h3>
            {activeTab === 'feed' ? (
                <>
                    <p>{t('feed.my_feed_empty')}</p>
                    <div className="socnet-feed-actions">
                        <Link to="/friends?tab=all" className="socnet-btn-small">
                            {t('feed.find_friends')}
                        </Link>
                        <button className="socnet-btn-small" onClick={() => handleTabChange('global')}>
                            {t('feed.view_global_feed')}
                        </button>
                    </div>
                </>
            ) : (
                <p>{t('feed.global_feed_empty')}</p>
            )}
        </div>
    );

    const handleRepostSuccess = (newPost) => setPosts(prevPosts => [newPost, ...prevPosts]);

    return (
        <div className="socnet-feed-page">
            <div className="socnet-tabs">
                <button className={`socnet-tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => handleTabChange('feed')}>
                    {t('feed.my_feed')}
                </button>
                <button className={`socnet-tab ${activeTab === 'global' ? 'active' : ''}`} onClick={() => handleTabChange('global')}>
                    {t('feed.global_feed')}
                </button>
            </div>

            <InfiniteScrollList
                itemsCount={posts.length}
                isLoadingInitial={loading && page === 1}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                error={error}
                onRetry={fetchFeed}
                emptyState={<EmptyState />}
            >
                {posts.map(post => (
                    <PostItem
                        key={post.id}
                        post={post}
                        currentUserId={authUser?.id}
                        isOwner={authUser?.id === post.user?.id}
                        onRepostSuccess={handleRepostSuccess}
                    />
                ))}
            </InfiniteScrollList>
        </div>
    );
}