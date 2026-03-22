import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { notifyError, notifySuccess } from "../../common/Notify";
import { useModal } from "../../../context/ModalContext";
import PostService from '../../../services/post.service';

export const useUserWall = (profileUser) => {
    const { t } = useTranslation();
    const { openConfirm } = useModal();
    const queryClient = useQueryClient();

    const queryKey = ['wall', profileUser?.username];

    const [editingPostId, setEditingPostId] = useState(null);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 1 }) => PostService.getUserPosts(profileUser?.username, pageParam),
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta || lastPage?.data?.meta;
            return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        },
        enabled: !!profileUser?.username
    });

    const posts = data?.pages.flatMap(page => page.data?.data || page.data || []) || [];

    const firstPageMeta = data?.pages[0]?.meta || data?.pages[0]?.data?.meta;
    const countPosts = firstPageMeta?.total || 0;

    const createMutation = useMutation({
        mutationFn: ({ content, images, entities }) => PostService.create({ images, content, target_user_id: profileUser.id, entities }),
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
                notifyError(res.message || t('error.publish_post'));
            }
        }
    });

    const editMutation = useMutation({
        mutationFn: ({ postId, updateData }) => PostService.update(postId, updateData),
        onSuccess: (res, variables) => {
            if (res.success) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            data: page.data.map(p => p.id === variables.postId ? res.data : p)
                        }))
                    };
                });
                notifySuccess(res.message || t('success.changes_saved'));
                setEditingPostId(null);
            } else {
                notifyError(res.message);
            }
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (postId) => PostService.delete(postId),
        onSuccess: (res, deletedId) => {
            if (res.success) {
                queryClient.setQueryData(queryKey, (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            data: page.data.filter(p => p.id !== deletedId)
                        }))
                    };
                });
            } else {
                notifyError(res.message || t('error.delete_post'));
            }
        }
    });

    const createPost = async (content, images, entities = null) => {
        await createMutation.mutateAsync({ content, images, entities });
        return true;
    };

    const saveEdit = async (postId, updateData) => {
        await editMutation.mutateAsync({ postId, updateData });
    };

    const handleDelete = async (postId) => {
        const isConfirmed = await openConfirm(t('post.delete_post'));
        if (!isConfirmed) return;
        await deleteMutation.mutateAsync(postId);
    };

    const handleRepostSuccess = (newPost) => {
        queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData) return oldData;
            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
                newPages[0] = { ...newPages[0], data: [newPost, ...newPages[0].data] };
            }
            return { ...oldData, pages: newPages };
        });
    };

    return {
        posts,
        countPosts,
        isPageLoading: isLoading,
        hasMore: !!hasNextPage,
        isLoadingMore: isFetchingNextPage,
        loadMore: fetchNextPage,
        createPost,
        handleDelete,
        editingPostId,
        handleRepostSuccess,
        startEditing: (post) => setEditingPostId(post.id),
        cancelEditing: () => setEditingPostId(null),
        saveEdit
    };
};