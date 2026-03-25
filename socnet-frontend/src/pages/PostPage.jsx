import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostItem from "../components/post/PostItem";
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import CommentsSection from "../components/comments/CommentsSection";
import { useTranslation } from 'react-i18next';
import postService from "../services/post.service";

export default function PostPage() {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    usePageTitle(t('common.post'));

    useEffect(() => {
        const fetchPosts = async (id) => {
            const res = await postService.get(id);

            if (res.success) {
                setPost(res.data);
            } else {
                setError(res.status === 404 ? t('post.not_found') : res.message);
            }

            setLoading(false);
        }
        fetchPosts(id);
    }, [id])

    const handleCommentCountChange = (amount) => {
        setPost(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                comments_count: prev.comments_count + amount
            };
        });
    };

    if (loading)
        return <div className="tetrone-empty-state">{t('common.loading')}</div>;

    // переробити на окремий компонент помилки загрузки
    if (error)
        return (
            <div className="tetrone-empty-state with-card">
                <h3>{error}</h3>
                <p>{t('error.loading_post')}</p>
                <div className="tetrone-feed-actions">
                    <button
                        className="tetrone-btn-small"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.reload_page')}
                    </button>
                </div>
            </div>
        );

    return (
        <div className="tetrone-post-page-wrapper">
            {user && (
                <button onClick={() => navigate(-1)} className="tetrone-back-btn">
                    {t('common.back')}
                </button>
            )}

            <PostItem post={post} />

            <div className="tetrone-post-comments-wrapper">
                <CommentsSection
                    postId={post.id}
                    onCountChange={handleCommentCountChange}
                />
            </div>
        </div>
    );
}