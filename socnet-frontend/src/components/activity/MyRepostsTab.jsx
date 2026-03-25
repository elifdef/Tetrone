import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '../../services/activity.service';
import fetchClient from '../../api/client';
import PostItem from '../post/PostItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { notifyError } from '../common/Notify';
import { useModal } from '../../context/ModalContext';

export default function MyRepostsTab({ onCountUpdate }) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [reposts, setReposts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchReposts = useCallback(async () => {
        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        const res = await ActivityService.getMyReposts(page);

        if (res.success) {
            const newReposts = res.data || [];
            const meta = res.meta;

            setReposts(prev => {
                if (page === 1) return newReposts;
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newReposts.filter(newItem => !existingIds.has(newItem.id));
                return [...prev, ...uniqueNew];
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
        fetchReposts();
    }, [fetchReposts]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleDelete = async (postId) => {
        const isConfirmed = await openConfirm(t('post.delete_post'));
        if (!isConfirmed) return;

        const res = await fetchClient(`/posts/${postId}`, { method: 'DELETE' });

        if (res.success) {
            setReposts(prev => prev.filter(p => p.id !== postId));
            if (onCountUpdate) onCountUpdate(-1);
        } else {
            notifyError(res.message || t('error.delete_data'));
        }
    };

    return (
        <InfiniteScrollList
            itemsCount={reposts.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={fetchReposts}
            className="tetrone-post-list"
            emptyState={
                <div className="tetrone-empty-state">
                    <p>{t('activity.reposts.empty')}</p>
                </div>
            }
        >
            {reposts.map(post => (
                <PostItem
                    key={post.id}
                    post={post}
                    isOwner={true}
                    onDelete={handleDelete}
                />
            ))}
        </InfiniteScrollList>
    );
}