import { useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export const usePostLike = (post) => {
    const { user } = useContext(AuthContext);

    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [isLiking, setIsLiking] = useState(false);

    const handleLike = async () => {
        if (!user || isLiking) return;

        setIsLiking(true);

        const previousLiked = isLiked;
        const previousCount = likesCount;

        setIsLiked(!previousLiked);
        setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

        try {
            const res = await api.post(`/posts/${post.id}/like`);
            setLikesCount(res.data.likes_count);
            setIsLiked(res.data.liked);
        } catch (error) {
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
        } finally {
            setIsLiking(false);
        }
    };

    return { isLiked, likesCount, handleLike };
};