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

        try {
            const res = await PostService.getUserPosts(profileUser.username, pageNumber);
            const processedPosts = res.data;

            if (pageNumber === 1) setPosts(processedPosts);
            else setPosts(prev => {
                const uniqueNewPosts = processedPosts.filter(
                    newPost => !prev.some(existingPost => existingPost.id === newPost.id)
                );
                return [...prev, ...uniqueNewPosts];
            });

            const meta = res.meta;
            setCountPosts(res.meta.total);
            setHasMore(meta.current_page < meta.last_page);
        } catch (err) {
            if (err.response && err.response.status === 403) setPosts([]);
            else notifyError(t('error.loading_post'));
        } finally {
            if (pageNumber === 1) setIsPageLoading(false);
            else setIsLoadingMore(false);
        }
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
        try {
            const newPost = await PostService.create({
                images, content, target_user_id: profileUser.id, entities
            });
            setPosts([newPost, ...posts]);
            setCountPosts(countPosts + 1);
            return true;
        } catch (error) {
            notifyError(error.response?.data?.message || t('common.error'));
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
        try {
            const updatedPostData = await PostService.update(postId, updateData);
            setPosts(prev => prev.map(p => p.id === postId ? updatedPostData : p));
            notifySuccess(t('success.changes_saved'));
            cancelEditing();
        } catch (error) {
            notifyError(t('error.save_changes'));
        }
    };

    const handleDelete = async (postId) => {
        const isConfirmed = await openConfirm(t('post.delete_post'));
        if (!isConfirmed) return;
        try {
            await PostService.delete(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            setCountPosts(prev => prev - 1);
        } catch (error) {
            notifyError(t('error.deleting'));
        }
    };

    return {
        posts, countPosts, isPageLoading, hasMore, isLoadingMore, loadMore,
        createPost, handleDelete, editingPostId, handleRepostSuccess,
        startEditing, cancelEditing, saveEdit
    };
};