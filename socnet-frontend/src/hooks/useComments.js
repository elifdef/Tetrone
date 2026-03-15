import { useState, useEffect, useCallback } from "react";
import CommentService from "../services/comment.service";
import { notifyError } from "../components/common/Notify";
import { useTranslation } from 'react-i18next';
import { useModal } from "../context/ModalContext";

export const useComments = (postId) => {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const fetchComments = useCallback(async () => {
        let isMounted = true;

        if (page === 1) setIsLoadingInitial(true);
        else setIsLoadingMore(true);

        setError(false);

        try {
            const { items, meta } = await CommentService.getComments(postId, page);

            if (isMounted) {
                setComments(prev => {
                    if (page === 1) return items;

                    const existingIds = new Set(prev.map(c => c.id));
                    const uniqueNewComments = items.filter(c => !existingIds.has(c.id));
                    return [...prev, ...uniqueNewComments];
                });

                setHasMore(meta ? meta.current_page < meta.last_page : false);
            }
        } catch (err) {
            if (isMounted) {
                notifyError(t('error.loading_comments'));
                setError(true);
                console.error("Failed to load comments:", err.data?.message || err.message);
            }
        } finally {
            if (isMounted) {
                setIsLoadingInitial(false);
                setIsLoadingMore(false);
            }
        }
    }, [postId, page, t]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const loadMore = useCallback(() => {
        if (!isLoadingInitial && !isLoadingMore && hasMore && !error) {
            setPage(p => p + 1);
        }
    }, [isLoadingInitial, isLoadingMore, hasMore, error]);

    const addComment = async (content) => {
        if (!content.trim()) return false;

        try {
            const res = await CommentService.addComment(postId, content);
            const newComment = res.data || res;

            setComments(prev => [newComment, ...prev]);
            return true;
        } catch (err) {
            notifyError(err.data?.message || t('error.add_comment'));
            return false;
        }
    };

    const removeComment = async (commentId) => {
        const isConfirmed = await openConfirm(t('comment.remove_comment'));
        if (!isConfirmed) return false;

        try {
            await CommentService.delete(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            return true;
        } catch (err) {
            notifyError(err.data?.message || t('error.deleting'));
            return false;
        }
    };

    return {
        comments,
        isLoadingInitial,
        isLoadingMore,
        hasMore,
        error,
        fetchComments,
        loadMore,
        addComment,
        removeComment
    };
};