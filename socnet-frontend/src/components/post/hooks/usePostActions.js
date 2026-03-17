import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { usePostLike } from "./usePostLike";
import { useModal } from "../../../context/ModalContext";
import { notifyError, notifySuccess } from "../../common/Notify";
import PostService from "../../../services/post.service";

export const usePostActions = (initialPost, readonly, onLikeToggle, onRepostSuccess) => {
    const { t } = useTranslation();
    const { openPrompt } = useModal();

    const [postData, setPostData] = useState(initialPost);
    const [isReposting, setIsReposting] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        setPostData(initialPost);
    }, [initialPost]);

    const { handleLike } = usePostLike(postData);

    const updateLocalPost = (updates) => {
        if (readonly) return;
        setPostData(prev => ({ ...prev, ...updates }));
    };

    const toggleLike = async () => {
        if (readonly) return;

        const result = await handleLike();
        if (result) {
            setPostData(prev => ({
                ...prev,
                is_liked: result.liked,
                likes_count: result.likes_count
            }));

            if (onLikeToggle) {
                onLikeToggle(postData.id, result.liked);
            }
        }
    };

    const createRepost = async () => {
        if (readonly) return;

        const content = await openPrompt(
            t('common.repost'), t('common.comment'), true
        );

        if (content === null) return;

        setIsReposting(true);

        const targetId = postData.is_repost ? postData.original_post_id : postData.id;

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

            if (onRepostSuccess && res.data) {
                onRepostSuccess(res.data);
            }
        } else {
            notifyError(res.message || t('error.publish_post'));
        }

        setIsReposting(false);
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