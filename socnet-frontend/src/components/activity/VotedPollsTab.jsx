import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '../../services/activity.service';
import PostItem from '../post/PostItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { notifyError } from '../common/Notify';

export default function VotedPollsTab() {
    const { t } = useTranslation();

    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchPolls = useCallback(async () => {
        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        const res = await ActivityService.getVotedPolls(page);

        if (res.success) {
            const items = res.data || [];
            const meta = res.meta;

            setPosts(prev => {
                if (page === 1) return items;
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPosts = items.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewPosts];
            });

            setHasMore(meta ? meta.current_page < meta.last_page : false);
        } else {
            notifyError(res.message || t('error.load_data'));
            setError(true);
        }

        setIsLoadingInitial(false);
        setIsLoadingMore(false);
    }, [page, t]);
    useEffect(() => {
        fetchPolls();
    }, [fetchPolls]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleUpdatePost = (updatedPost) => {
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    };



    return (
        <InfiniteScrollList
            itemsCount={posts.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={fetchPolls}
            className="tetrone-feed-list"
            emptyState={
                <div className="tetrone-empty-state">
                    <p>{t('activity.no_voted_polls_desc')}</p>
                </div>
            }
        >
            {posts.map((post, index) => (
                <PostItem
                    key={post.id || `poll-${index}`}
                    post={post}
                    onUpdate={handleUpdatePost}
                    readonly={true}
                />
            ))}
        </InfiniteScrollList>
    );
}