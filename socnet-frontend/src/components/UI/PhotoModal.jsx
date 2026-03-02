import { useEffect, useState } from "react";
import CommentsSection from "../comments/CommentsSection";
import PostFooter from "../post/PostFooter";
import { usePostLike } from "../../hooks/usePostLike";
import PostHeader from "../post/PostHeader";
import PostContent from "../post/PostContent";

export default function PhotoModal({ isOpen, image, post, onClose, onUpdate }) {
    const [modalPost, setModalPost] = useState(post);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [isOpen]);

    useEffect(() => {
        setModalPost(post);
    }, [post]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const { handleLike } = usePostLike(modalPost);

    const handleModalLike = async () => {
        const result = await handleLike();

        if (result) {
            // оновлюємо локальну модалку
            setModalPost(prev => ({
                ...prev,
                is_liked: result.liked,
                likes_count: result.likes_count
            }));

            // оновлюємо батька
            if (onUpdate) {
                onUpdate({
                    is_liked: result.liked,
                    likes_count: result.likes_count
                });
            }
        }
    };

    const handleCommentCountChange = (amount) => {
        setModalPost(prev => {
            const newCount = prev.comments_count + amount;
            return {
                ...prev,
                comments_count: newCount
            };
        });

        if (onUpdate) {
            onUpdate({ comments_count: modalPost.comments_count + amount });
        }
    };

    if (!isOpen || !modalPost)
        return null;

    return (
        <div className="socnet-modal-overlay" onClick={onClose}>
            <button
                className="socnet-modal-close"
                onClick={onClose}
            >
                ✕
            </button>

            <div className="socnet-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="socnet-modal-image-wrapper">
                    <img src={image} className="socnet-modal-image" />
                </div>

                <div className="socnet-modal-info">
                    <PostHeader
                        post={modalPost}
                        isOwner={false}
                    />

                    <PostContent
                        content={modalPost.content}
                    />

                    <PostFooter
                        postId={modalPost.id}
                        isLiked={modalPost.is_liked}
                        likesCount={modalPost.likes_count}
                        commentsCount={modalPost.comments_count}
                        onLike={handleModalLike}
                    />

                    <CommentsSection
                        postId={modalPost.id}
                        onCountChange={handleCommentCountChange}
                    />
                </div>
            </div>
        </div>
    );
}