import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import PostService from "../../../services/post.service";
import { notifyError } from "../../../components/common/Notify";
import { useTranslation } from 'react-i18next';

export const usePostLike = (post) => {
    const { t } = useTranslation();
    const [isLiked, setIsLiked] = useState(post?.is_liked || false);
    const [likesCount, setLikesCount] = useState(post?.likes_count || 0);

    const mutation = useMutation({
        mutationFn: () => PostService.toggleLike(post.id),
        
        onMutate: () => {
            setIsLiked(!isLiked);
            setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
        },
        
        onSuccess: (res) => {
            if (res.success) {
                setLikesCount(res.data.likes_count);
                setIsLiked(res.data.liked);
            } else {
                // Якщо бекенд повернув 200, але success: false
                setIsLiked(isLiked); // Відкочуємо назад
                setLikesCount(likesCount);
                notifyError(res.message || t('error.connection'));
            }
        },
        
        // onError спрацює, якщо сервер впав або зник інтернет
        onError: (err) => {
            setIsLiked(isLiked); // Відкочуємо назад
            setLikesCount(likesCount);
            notifyError(err.message || t('error.connection'));
        }
    });

    return { 
        isLiked, 
        likesCount, 
        handleLike: () => mutation.mutate(),
        isLiking: mutation.isPending 
    };
};