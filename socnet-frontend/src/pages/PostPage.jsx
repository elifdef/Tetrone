import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostItem from "../components/post/PostItem";
import EditPostForm from "../components/post/EditPostForm";
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import CommentsSection from "../components/comments/CommentsSection";
import { useTranslation } from 'react-i18next';
import postService from "../services/post.service";
import ErrorState from "../components/ui/ErrorState";

export default function PostPage() {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    usePageTitle(t('common.post'));

    useEffect(() => {
        setLoading(true);
        setError(null);

        postService.get(id)
            .then(res => {
                if (res.success && res.data) {
                    setPost(res.data);
                }
            })
            .catch(err => {
                setError(err.message || t('error.loading_post'));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id, t]);

    const handleCommentCountChange = (amount) => {
        setPost(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                comments_count: prev.comments_count + amount
            };
        });
    };

    if (loading) {
        return <div className="tetrone-empty-state">{t('common.loading')}</div>;
    }

    if (error || !post) {
        return (
            <ErrorState
                title={error || t('error.not_found')}
                description={t('error.try_again_later')}
                onRetry={() => window.location.reload()}
            />
        );
    }

    const isOwner = user && post && user.id === post.user_id;

    const handleSaveEdit = async (postId, editData) => {
        try {
            const res = await postService.update(postId, editData);

            if (res.success && res.data) {
                setPost(res.data);
                setIsEditing(false); 
            }
        } catch (err) {
            console.error('Помилка збереження:', err);
        }
    };

    if (isEditing) {
        return (
            <div className="tetrone-post-page-wrapper">
                <EditPostForm
                    post={post}
                    saveEdit={handleSaveEdit}    
                    cancelEditing={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="tetrone-post-page-wrapper">
            <button onClick={() => navigate(-1)} className="tetrone-nav-back-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                {t('common.back')}
            </button>

            <div className="tetrone-single-post-card">
                <PostItem
                    post={post}
                    isOwner={isOwner}
                    currentUserId={user?.id}
                    onEdit={() => setIsEditing(true)}
                    onDelete={() => navigate('/')}
                    isInner={false}
                    readonly={false}
                />
            </div>

            <div className="tetrone-single-comments-card">
                <CommentsSection
                    postId={post.id}
                    onCountChange={handleCommentCountChange}
                />
            </div>
        </div>
    );
}