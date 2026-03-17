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

        const res = await PostService.toggleLike(post.id);

        if (res.success) {
            setLikesCount(res.data.likes_count);
            setIsLiked(res.data.liked);
            setIsLiking(false);
            return {
                liked: res.data.liked,
                likes_count: res.data.likes_count
            };
        } else {
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
            notifyError(res.message || t('error.connection'));
            setIsLiking(false);
            return null;
        }
    };

    return { isLiked, likesCount, handleLike };
};