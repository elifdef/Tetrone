import { useState } from "react";
import PostService from "../../../services/post.service";
import { notifyError } from "../../../components/common/Notify";
import { useTranslation } from 'react-i18next';

export const usePostLike = (post) => {
    const { t } = useTranslation();
    const [isLiked, setIsLiked] = useState(post?.is_liked || false);
    const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
    const [isLiking, setIsLiking] = useState(false);

    const handleLike = async () => {
        if (!post || isLiking) return null;

        setIsLiking(true);

        const previousLiked = isLiked;
        const previousCount = likesCount;

        setIsLiked(!previousLiked);
        setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

        try {
            const data = await PostService.toggleLike(post.id);

            setLikesCount(data.likes_count);
            setIsLiked(data.liked);

            return {
                liked: data.liked,
                likes_count: data.likes_count
            };

        } catch (error) {
            setIsLiked(previousLiked);
            setLikesCount(previousCount);

            notifyError(error.data?.message || t('error.connection'));
            return null;
        } finally {
            setIsLiking(false);
        }
    };

    return { isLiked, likesCount, handleLike };
};