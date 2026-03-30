import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CommentService from "../../../services/comment.service";
import { notifyError } from "../../common/Notify";
import { useTranslation } from 'react-i18next';
import { useModal } from "../../../context/ModalContext";

export const useComments = (postId) => {
    const { t } = useTranslation();
    const { openConfirm } = useModal();
    const queryClient = useQueryClient();
    const queryKey = ['comments', postId];

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => CommentService.getComments(postId, pageParam),
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta;
            return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        },
        enabled: !!postId
    });

    const comments = data?.pages.flatMap(page => page.data || []) || [];

    const addMutation = useMutation({
        mutationFn: (content) => CommentService.addComment(postId, content),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    const newPages = [...oldData.pages];
                    if (newPages.length > 0) {
                        newPages[0] = { ...newPages[0], data: [res.data, ...newPages[0].data] };
                    }
                    return { ...oldData, pages: newPages };
                });
            } else {
                notifyError(res.message || t('error.add_comment'));
            }
        }
    });

    const editMutation = useMutation({
        mutationFn: ({ id, content }) => CommentService.update(id, content),
        onSuccess: (res, variables) => {
            if (res.success) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            data: page.data.map(c => c.id === variables.id ? res.data : c)
                        }))
                    };
                });
            } else {
                notifyError(res.message || t('error.edit_comment'));
            }
        }
    });

    const addComment = async (content) => {
        if (!content) return false;
        if (typeof content === 'string' && !content.trim()) return false;
        
        await addMutation.mutateAsync(content);
        return true;
    };

    const editComment = async (commentId, newContent) => {
        if (!newContent) return false;
        if (typeof newContent === 'string' && !newContent.trim()) return false;

        await editMutation.mutateAsync({ id: commentId, content: newContent });
        return true;
    };

    const removeComment = async (commentId) => {
        const isConfirmed = await openConfirm(t('comment.remove_comment'));
        if (!isConfirmed) return false;
        await deleteMutation.mutateAsync(commentId);
        return true;
    };

    return {
        comments,
        isLoadingInitial: isLoading,
        isLoadingMore: isFetchingNextPage,
        hasMore: !!hasNextPage,
        error: isError,
        fetchComments: refetch,
        loadMore: fetchNextPage,
        addComment,
        editComment,
        removeComment
    };
};