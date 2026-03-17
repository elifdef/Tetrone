import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notifySuccess, notifyError } from "../../common/Notify";
import { useModal } from "../../../context/ModalContext";
import PostService from '../../../services/post.service';

export const useUserWall = (profileUser) => {
    const { t } = useTranslation();
    const { openConfirm } = useModal();

    const [posts, setPosts] = useState([]);
    const [countPosts, setCountPosts] = useState(0);
    const [isPageLoading, setIsPageLoading] = useState(true);

    const [editingPostId, setEditingPostId] = useState(null);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const fetchPosts = async (pageNumber = 1) => {
        if (!profileUser?.username) return;

        if (pageNumber > 1) setIsLoadingMore(true);
        else setIsPageLoading(true);

        const res = await PostService.getUserPosts(profileUser.username, pageNumber);

        if (res.success) {
            const processedPosts = res.data.data || res.data;
            const meta = res.data.meta;

            if (pageNumber === 1) {
                setPosts(processedPosts);
            } else {
                setPosts(prev => {
                    const uniqueNewPosts = processedPosts.filter(
                        newPost => !prev.some(existingPost => existingPost.id === newPost.id)
                    );
                    return [...prev, ...uniqueNewPosts];
                });
            }

            setCountPosts(meta?.total || 0);
            setHasMore(meta ? meta.current_page < meta.last_page : false);
        } else {
            if (res.status === 403) {
                setPosts([]);
            } else {
                notifyError(res.message);
            }
        }

        if (pageNumber === 1) setIsPageLoading(false);
        else setIsLoadingMore(false);
    };

    useEffect(() => {
        setPage(1); setHasMore(true); setPosts([]); setIsPageLoading(true);
        fetchPosts(1);
    }, [profileUser?.username]);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage);
        }
    }, [isLoadingMore, hasMore, page, profileUser?.username]);

    const createPost = async (content, images, entities = null) => {
        const res = await PostService.create({
            images, content, target_user_id: profileUser.id, entities
        });

        if (res.success) {
            setPosts([res.data, ...posts]);
            setCountPosts(countPosts + 1);
            return true;
        } else {
            notifyError(res.message || t('error.publish_post'));
            return false;
        }
    };

    const handleRepostSuccess = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
        setCountPosts(prev => prev + 1);
    };

    const startEditing = (post) => setEditingPostId(post.id);
    const cancelEditing = () => setEditingPostId(null);

    const saveEdit = async (postId, updateData) => {
        const res = await PostService.update(postId, updateData);

        if (res.success) {
            setPosts(prev => prev.map(p => p.id === postId ? res.data : p));
            notifySuccess(res.message || t('success.changes_saved'));
            cancelEditing();
        } else {
            notifyError(res.message);
        }
    };

    const handleDelete = async (postId) => {
        const isConfirmed = await openConfirm(t('post.delete_post'));
        if (!isConfirmed) return;

        const res = await PostService.delete(postId);

        if (res.success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
            setCountPosts(prev => prev - 1);
        } else {
            notifyError(res.message || t('error.delete_post'));
        }
    };

    return {
        posts, countPosts, isPageLoading, hasMore, isLoadingMore, loadMore,
        createPost, handleDelete, editingPostId, handleRepostSuccess,
        startEditing, cancelEditing, saveEdit
    };
};