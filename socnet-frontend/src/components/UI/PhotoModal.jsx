import React, { useEffect, useState, useCallback } from "react";
import CommentsSection from "../comments/CommentsSection";
import PostFooter from "../post/PostFooter";
import { usePostLike } from "../post/hooks/usePostLike";
import PostHeader from "../post/PostHeader";
import RichText from "../post/content/RichText";
import { usePostMedia } from "../post/hooks/usePostMedia";
import VideoPlayer from "./VideoPlayer";

export default function PhotoModal({ isOpen, mediaId, post, onClose, onUpdate }) {
    const [modalPost, setModalPost] = useState(post);
    const [currentIndex, setCurrentIndex] = useState(0);

    const { local, external } = usePostMedia(
        modalPost?.content || '',
        modalPost?.attachments || [],
        modalPost?.entities || null
    );

    const mediaFiles = React.useMemo(() => {
        return [
            ...local.images,
            ...local.videos,
            ...external.youtube.filter(yt => !yt.isRemoved)
        ];
    }, [local.images, local.videos, external.youtube]);

    useEffect(() => {
        if (!mediaId || mediaFiles.length === 0) return;
        const index = mediaFiles.findIndex(m => m.id === mediaId || m.videoId === mediaId);
        setCurrentIndex(index !== -1 ? index : 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaId]);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    useEffect(() => {
        setModalPost(post);
    }, [post]);

    const handleNext = useCallback((e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % mediaFiles.length);
    }, [mediaFiles.length]);

    const handlePrev = useCallback((e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
    }, [mediaFiles.length]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && mediaFiles.length > 1) handleNext();
            if (e.key === 'ArrowLeft' && mediaFiles.length > 1) handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, handleNext, handlePrev, mediaFiles.length]);

    const { handleLike } = usePostLike(modalPost);

    const handleModalLike = async () => {
        const result = await handleLike();
        if (result) {
            setModalPost(prev => ({
                ...prev,
                is_liked: result.liked,
                likes_count: result.likes_count
            }));
            if (onUpdate) onUpdate({ is_liked: result.liked, likes_count: result.likes_count });
        }
    };

    const handleCommentCountChange = (amount) => {
        setModalPost(prev => ({ ...prev, comments_count: prev.comments_count + amount }));
        if (onUpdate) onUpdate({ comments_count: modalPost.comments_count + amount });
    };

    if (!isOpen || !modalPost) return null;

    const currentMedia = mediaFiles[currentIndex];

    return (
        <div className="socnet-modal-fullscreen-overlay" onClick={onClose}>
            <button className="socnet-modal-close-fullscreen" onClick={onClose}>✕</button>

            <div className="socnet-modal-fullscreen-layout" onClick={(e) => e.stopPropagation()}>

                <div className="socnet-modal-media-section">
                    {mediaFiles.length > 1 && (
                        <>
                            <button className="socnet-modal-nav-btn left" onClick={handlePrev}>‹</button>
                            <button className="socnet-modal-nav-btn right" onClick={handleNext}>›</button>
                            <div className="socnet-modal-counter">
                                {currentIndex + 1} / {mediaFiles.length}
                            </div>
                        </>
                    )}

                    {currentMedia?.type === 'image' && (
                        <img src={currentMedia.url} className="socnet-modal-fullscreen-image" alt="" />
                    )}

                    {currentMedia?.type === 'video' && (
                        <VideoPlayer src={currentMedia.url} controls className="socnet-modal-fullscreen-video" />
                    )}

                    {currentMedia?.videoId && (
                        <div className="socnet-modal-fullscreen-youtube">
                            <VideoPlayer src={currentMedia.videoId} provider="youtube" />
                        </div>
                    )}
                </div>

                <div className="socnet-modal-sidebar-section">
                    <div className="socnet-modal-sidebar-scroll">
                        <PostHeader post={modalPost} isOwner={false} />

                        <div className="socnet-post-content">
                            <RichText text={modalPost.content} />
                        </div>

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
        </div>
    );
}