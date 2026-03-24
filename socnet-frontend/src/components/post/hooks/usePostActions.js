import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useModal } from "../../../context/ModalContext";
import { notifyError, notifySuccess } from "../../common/Notify";
import PostService from "../../../services/post.service";

/**
 * Хук для керування станом поста (Лайки, Репости, Стейт).
 * Використовує Optimistic UI для миттєвого відображення лайків.
 */
export const usePostActions = (initialPost, readonly, onLikeToggle, onRepostSuccess) => {
    const { t } = useTranslation();
    const { openPrompt } = useModal();

    const [postData, setPostData] = useState(initialPost);
    const [isReposting, setIsReposting] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        setPostData(initialPost);
    }, [initialPost]);

    const updateLocalPost = (updates) => {
        if (readonly) return;
        setPostData(prev => ({ ...prev, ...updates }));
    };

    /**
     * Логіка Лайка (Optimistic Update)
     */
    const toggleLike = async () => {
        if (readonly || isLiking) return;

        setIsLiking(true);
        const originalLiked = postData.is_liked;
        const originalCount = postData.likes_count;

        // 1. Миттєво міняємо UI (Оптимістичне оновлення)
        setPostData(prev => ({
            ...prev,
            is_liked: !originalLiked,
            likes_count: originalLiked ? Math.max(0, prev.likes_count - 1) : prev.likes_count + 1
        }));

        try {
            // 2. Відправляємо запит на бекенд
            const res = await PostService.toggleLike(postData.id);

            if (res.success) {
                // 3. Синхронізуємо з реальними даними сервера
                setPostData(prev => ({
                    ...prev,
                    is_liked: res.data.liked,
                    likes_count: res.data.likes_count
                }));
                if (onLikeToggle) onLikeToggle(postData.id, res.data.liked);
            } else {
                throw new Error(res.message);
            }
        } catch (err) {
            // 4. Відкат, якщо сталася помилка мережі
            setPostData(prev => ({
                ...prev,
                is_liked: originalLiked,
                likes_count: originalCount
            }));
            notifyError(err.message || t('error.connection'));
        } finally {
            setIsLiking(false);
        }
    };

    /**
     * Логіка створення Репосту
     */
    const createRepost = async () => {
        if (readonly) return;

        const content = await openPrompt(t('common.repost'), t('common.comment'), true);
        if (content === null) return;

        setIsReposting(true);
        const targetId = postData.is_repost ? postData.original_post_id : postData.id;

        try {
            const res = await PostService.create({
                content: content.trim() !== '' ? content : null,
                original_post_id: targetId
            });

            if (res.success) {
                notifySuccess(res.message || t('post.repost_success'));
                setPostData(prev => ({
                    ...prev,
                    reposts_count: (prev.reposts_count || 0) + 1
                }));
                if (onRepostSuccess && res.data) onRepostSuccess(res.data);
            } else {
                notifyError(res.message || t('error.publish_post'));
            }
        } catch (err) {
            notifyError(t('error.connection'));
        } finally {
            setIsReposting(false);
        }
    };

    return {
        postData,
        isReposting,
        isReportModalOpen,
        setIsReportModalOpen,
        updateLocalPost,
        toggleLike,
        createRepost
    };
};