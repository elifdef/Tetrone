import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

    const fetchReposts = useCallback(() => {
        let isMounted = true;

        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        fetchClient(`/activity/reposts?page=${page}`)
            .then(data => {
                if (isMounted) {
                    const newReposts = data.data;
                    const meta = data.meta;

                    setReposts(prev => {
                        if (page === 1) return newReposts;
                        const uniqueNew = newReposts.filter(
                            newItem => !prev.some(existing => existing.id === newItem.id)
                        );
                        return [...prev, ...uniqueNew];
                    });

                    setHasMore(meta ? meta.current_page < meta.last_page : false);
                }
            })
            .catch(err => {
                notifyError(t('error.loading_reposts'));
                if (isMounted) setError(true);
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingInitial(false);
                    setIsLoadingMore(false);
                }
            });

        return () => { isMounted = false; };
    }, [page, t]);

    useEffect(() => {
        const cleanup = fetchReposts();
        return cleanup;
    }, [fetchReposts]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleDelete = async (postId) => {
        const isConfirmed = await openConfirm(t('post.delete_post'));
        if (!isConfirmed) return;

        try {
            await fetchClient(`/posts/${postId}`, { method: 'DELETE' });
            
            setReposts(prev => prev.filter(p => p.id !== postId));
            if (onCountUpdate) onCountUpdate(-1);

        } catch (error) {
            notifyError(t('error.deleting'));
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
            className="socnet-post-list"
            emptyState={
                <div className="socnet-empty-state">
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