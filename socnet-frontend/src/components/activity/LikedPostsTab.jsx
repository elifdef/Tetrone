import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '../../services/activity.service';
import PostItem from '../post/PostItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { notifyError } from '../common/Notify';

export default function LikedPostsTab({ onCountUpdate }) {
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchLikedPosts = useCallback(async () => {
        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        const res = await ActivityService.getLikedPosts(page);

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
            notifyError(res.message || t('error.loading_likes'));
            setError(true);
        }

        setIsLoadingInitial(false);
        setIsLoadingMore(false);
    }, [page, t]);

    useEffect(() => {
        fetchLikedPosts();
    }, [fetchLikedPosts]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleLikeToggle = (postId, isLiked) => {
        if (!isLiked) {
            setPosts(prev => prev.filter(p => p.id !== postId));
            if (onCountUpdate) onCountUpdate(-1);
        }
    };

    return (
        <InfiniteScrollList
            itemsCount={posts.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={fetchLikedPosts}
            className="socnet-feed-list"
            emptyState={
                <div className="socnet-empty-state">
                    <p>{t('activity.likes.empty')}</p>
                </div>
            }
            endMessage={t('common.no_more_data')}
        >
            {posts.map(post => (
                <PostItem
                    key={post.id}
                    post={post}
                    onLikeToggle={handleLikeToggle}
                />
            ))}
        </InfiniteScrollList>
    );
}