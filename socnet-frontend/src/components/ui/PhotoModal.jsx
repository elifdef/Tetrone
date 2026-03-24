import React, { useEffect, useState, useCallback } from "react";
import CommentsSection from "../comments/CommentsSection";
import PostFooter from "../post/PostFooter";
import PostHeader from "../post/PostHeader";
import RichText from "../common/RichText";
import { usePostMedia } from "../post/hooks/usePostMedia";
import VideoPlayer from "./VideoPlayer";
import { usePostActions } from "../post/hooks/usePostActions";

export default function PhotoModal({ isOpen, mediaId, post, onClose, onUpdate, onNext, onPrev, listCurrent, listTotal }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const {
        postData: modalPost,
        toggleLike,
        updateLocalPost
    } = usePostActions(post, false, null, null);

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
    }, [mediaId, mediaFiles]);

    useEffect(() => {
        if (isOpen) document.body.classList.add('modal-open');
        else document.body.classList.remove('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    useEffect(() => {
        updateLocalPost(post);
        setCurrentIndex(0);
    }, [post]);

    const handleNext = useCallback((e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % mediaFiles.length);
    }, [mediaFiles.length]);

    const handlePrev = useCallback((e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
    }, [mediaFiles.length]);

    const hasExternalNav = !!(onNext && onPrev);
    const showNav = mediaFiles.length > 1 || hasExternalNav;

    const clickPrev = (e) => {
        if (e) e.stopPropagation();
        if (mediaFiles.length > 1) handlePrev(e);
        else if (onPrev) onPrev(e);
    };

    const clickNext = (e) => {
        if (e) e.stopPropagation();
        if (mediaFiles.length > 1) handleNext(e);
        else if (onNext) onNext(e);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && showNav) clickNext();
            if (e.key === 'ArrowLeft' && showNav) clickPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, clickNext, clickPrev, showNav]);

    const handleModalLike = async () => {
        await toggleLike();
        if (onUpdate) {
            onUpdate({
                is_liked: !modalPost.is_liked,
                likes_count: modalPost.is_liked ? Math.max(0, modalPost.likes_count - 1) : modalPost.likes_count + 1
            });
        }
    };

    const handleCommentCountChange = (amount) => {
        updateLocalPost({ comments_count: modalPost.comments_count + amount });
        if (onUpdate) onUpdate({ comments_count: modalPost.comments_count + amount });
    };

    if (!isOpen || !modalPost) return null;

    const currentMedia = mediaFiles[currentIndex];

    return (
        <div className="tetrone-modal-fullscreen-overlay" onClick={onClose}>
            <button className="tetrone-modal-close-fullscreen" onClick={onClose}>✕</button>

            <div className="tetrone-modal-fullscreen-layout" onClick={(e) => e.stopPropagation()}>

                <div className="tetrone-modal-media-section">
                    {showNav && (
                        <>
                            <button className="tetrone-modal-nav-btn left" onClick={clickPrev}>‹</button>
                            <button className="tetrone-modal-nav-btn right" onClick={clickNext}>›</button>
                            <div className="tetrone-modal-counter">
                                {hasExternalNav ? `${listCurrent} / ${listTotal}` : `${currentIndex + 1} / ${mediaFiles.length}`}
                            </div>
                        </>
                    )}

                    {currentMedia?.type === 'image' && (
                        <img src={currentMedia.url} className="tetrone-modal-fullscreen-image" alt="" />
                    )}

                    {currentMedia?.type === 'video' && (
                        <VideoPlayer src={currentMedia.url} controls className="tetrone-modal-fullscreen-video" />
                    )}

                    {currentMedia?.videoId && (
                        <div className="tetrone-modal-fullscreen-youtube">
                            <VideoPlayer src={currentMedia.videoId} provider="youtube" />
                        </div>
                    )}
                </div>

                <div className="tetrone-modal-sidebar-section">
                    <div className="tetrone-modal-sidebar-scroll">
                        <PostHeader post={modalPost} isOwner={false} />

                        <div className="tetrone-post-content">
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