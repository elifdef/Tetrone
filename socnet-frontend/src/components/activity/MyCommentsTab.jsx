import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ActivityService from '../../services/activity.service';
import CommentService from '../../services/comment.service';
import ActivityCommentItem from './ActivityCommentItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { notifyError } from '../common/Notify';
import { useModal } from '../../context/ModalContext';

export default function MyCommentsTab({ onCountUpdate }) {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchComments = useCallback(async () => {
        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);
        setError(false);

        try {
            const { items, meta } = await ActivityService.getMyComments(page);

            setComments(prev => {
                if (page === 1) return items;

                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNewComments = items.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNewComments];
            });

            setHasMore(meta ? meta.current_page < meta.last_page : false);
        } catch (err) {
            if (err.name !== "AbortError") {
                notifyError(t('error.loading_comments'));
                setError(true);
                console.error("Failed to load comments:", err.data?.message || err.message);
            }
        } finally {
            setIsLoadingInitial(false);
            setIsLoadingMore(false);
        }
    }, [page, t]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const handleDeleteComment = async (commentId) => {
        const isConfirmed = await openConfirm(t('comment.remove_comment'));
        if (!isConfirmed) return;

        try {
            await CommentService.delete(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            if (onCountUpdate) onCountUpdate(-1);
        } catch (err) {
            notifyError(err.data?.message || t('error.deleting'));
        }
    };

    return (
        <InfiniteScrollList
            itemsCount={comments.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={fetchComments}
            className="socnet-notification-list"
            emptyState={
                <div className="socnet-empty-state">
                    <p>{t('activity.comments.empty')}</p>
                </div>
            }
            endMessage={t('common.no_more_data')}
        >
            {comments.map(comment => (
                <ActivityCommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={() => handleDeleteComment(comment.id)}
                />
            ))}
        </InfiniteScrollList>
    );
}