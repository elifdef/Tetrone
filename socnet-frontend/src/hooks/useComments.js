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

        const res = await CommentService.getComments(postId, page);

        if (isMounted) {
            if (res.success) {
                const items = res.data || [];
                const meta = res.meta;

                setComments(prev => {
                    if (page === 1) return items;
                    const existingIds = new Set(prev.map(c => c.id));
                    const uniqueNewComments = items.filter(c => !existingIds.has(c.id));
                    return [...prev, ...uniqueNewComments];
                });

                setHasMore(meta ? meta.current_page < meta.last_page : false);
            } else {
                notifyError(res.message || t('error.load_comments'));
                setError(true);
            }

            setIsLoadingInitial(false);
            setIsLoadingMore(false);
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

        const res = await CommentService.addComment(postId, content);

        if (res.success) {
            const newComment = res.data;
            setComments(prev => [newComment, ...prev]);
            return true;
        } else {
            notifyError(res.message || t('error.add_comment'));
            return false;
        }
    };

    const editComment = async (commentId, newContent) => {
        if (!newContent.trim()) return false;

        const res = await CommentService.update(commentId, newContent);

        if (res.success) {
            const updatedComment = res.data;
            setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
            return true;
        } else {
            notifyError(res.message || t('error.edit_comment'));
            return false;
        }
    };

    const removeComment = async (commentId) => {
        const isConfirmed = await openConfirm(t('comment.remove_comment'));
        if (!isConfirmed) return false;

        const res = await CommentService.delete(commentId);

        if (res.success) {
            setComments(prev => prev.filter(c => c.id !== commentId));
            return true;
        } else {
            notifyError(res.message || t('error.delete_comment'));
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
        editComment,
        removeComment
    };
};