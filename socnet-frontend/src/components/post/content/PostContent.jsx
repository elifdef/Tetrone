import { useState } from "react";
import { usePostMedia } from "../hooks/usePostMedia";
import RichText from "../../common/RichText";
import PostGallery from "./PostGallery";
import PostVideos from "./PostVideos";
import PostDocuments from "./PostDocuments";
import PostPoll from "./PostPoll";
import PhotoModal from "../../UI/PhotoModal";
import VideoPlayer from "../../UI/VideoPlayer";

export default function PostContent({ content: originalContent, post, onUpdate, isOwner, className }) {
    const { content, local, external } = usePostMedia(originalContent, post?.attachments, post?.entities);
    const [selectedMediaId, setSelectedMediaId] = useState(null);

    const hasOnlyOneVideo = local.videos.length === 1 && local.images.length === 0 && external.youtube.length === 0;

    return (
        <div className={`tetrone-post-content ${className || ''}`}>
            <RichText text={content} />

            {post?.poll && (
                <PostPoll poll={post.poll} postId={post.id} isOwner={isOwner} />
            )}

            {hasOnlyOneVideo && (
                <div className="tetrone-post-single-video">
                    <VideoPlayer src={local.videos[0].url} />
                </div>
            )}
            <>
                <PostVideos localVideos={local.videos} youtubeVideos={external.youtube} onMediaClick={setSelectedMediaId} />
                <PostGallery images={local.images} onMediaClick={setSelectedMediaId} />
            </>

            <PostDocuments documents={local.documents} />

            {selectedMediaId !== null && (
                <PhotoModal
                    isOpen={selectedMediaId !== null}
                    mediaId={selectedMediaId}
                    post={post}
                    onClose={() => setSelectedMediaId(null)}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
}