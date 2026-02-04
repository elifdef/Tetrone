import { useState, useEffect } from "react";
import api from "../api/axios";
import { notifyConfirmAction, notifyError } from "../components/Notify";
import { mapComment } from "../services/mappers";

export const useComments = (postId) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        api.get(`/posts/${postId}/comments`)
            .then(res => {
                if (isMounted) {
                    const comments = res.data.data.map(mapComment);
                    setComments(comments);
                }
            })
            .catch(err => notifyError(err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [postId]);

    const addComment = async (e) => {
        e.preventDefault();
        if (!text.trim())
            return false;

        try {
            const res = await api.post(`/posts/${postId}/comments`, { content: text });
            setComments(prev => [mapComment(res.data), ...prev]);
            setText("");
            return true;
        } catch (err) {
            notifyError("Не вдалося додати коментар");
            return false;
        }
    };

    const removeComment = async (commentId) => {
        const isConfirmed = await notifyConfirmAction("Видалити коментар?");
        if (!isConfirmed)
            return false;

        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
            return true;
        } catch (err) {
            notifyError("Помилка видалення");
            return false;
        }
    };

    return { comments, text, setText, loading, addComment, removeComment };
};