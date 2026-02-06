import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostItem from "../components/post/PostItem";
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import { mapPost } from "../services/mappers";
import CommentsSection from "../components/comments/CommentsSection";

export default function PostPage() {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    usePageTitle("Перегляд запису");

    useEffect(() => {
        api.get(`/posts/${id}`)
            .then(res => setPost(mapPost(res.data.data)))
            .catch(err => {
                setError(err.response?.status === 404 ? "Запис не знайдено" : "Помилка");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleCommentCountChange = (amount) => {
        setPost(prev => {
            if (!prev)
                return prev;

            return {
                ...prev,
                comments_count: prev.comments_count + amount
            };
        });
    };

    if (loading)
        return (<div style={{ padding: 20 }}>Завантаження...</div>);

    if (error)
        return (
            <div className="vk-feed-empty">
                <h3>Помилка з'єднання</h3>
                <p>Сталася помилка при завантаженні поста.</p>
                <div className="vk-feed-actions">
                    <button
                        className="vk-btn-small"
                        onClick={() => window.location.reload()}
                    >
                        Оновити сторінку
                    </button>
                </div>
            </div>
        );

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: 50 }}>
            {user && (
                <button
                    onClick={() => navigate(-1)}
                    style={{ border: 'none', background: 'none', color: '#2a5885', cursor: 'pointer', marginBottom: 10 }}
                >
                    ← Назад
                </button>
            )}

            <PostItem post={post} />

            <div style={{ borderTop: '1px solid var(--theme-border)' }}>
                <CommentsSection
                    postId={post.id}
                    onCountChange={handleCommentCountChange}
                />
            </div>
        </div>
    );
}