import { useState } from "react";
import { usePostMedia } from "../hooks/usePostMedia";
import { isOnlyStickers } from "../../../utils/editorHelpers";
import RichText from "../../common/RichText";
import PostGallery from "./PostGallery";
import PostVideos from "./PostVideos";
import PostDocuments from "./PostDocuments";
import PostPoll from "./PostPoll";
import PhotoModal from "../../UI/PhotoModal";

export default function PostContent({ content: originalContent, post, onUpdate, isOwner, className }) {
    const { content, local, external } = usePostMedia(
        originalContent,
        post?.attachments,
        { removed_previews: post?.youtube_settings?.removed_previews }
    );

    const [selectedImageId, setSelectedImageId] = useState(null);
    const bigStickersClass = isOnlyStickers(content) ? 'tetrone-post-only-stickers' : '';

    return (
        <div className={`tetrone-post-content ${bigStickersClass} ${className || ''}`}>
            <RichText text={content} />

            {post?.poll && (
                <PostPoll poll={post.poll} postId={post.id} isOwner={isOwner} />
            )}

            <PostVideos localVideos={local.videos} youtubeVideos={external.youtube} />
            <PostGallery images={local.images} onMediaClick={setSelectedImageId} />
            <PostDocuments documents={local.documents} />

            {selectedImageId !== null && (
                <PhotoModal
                    isOpen={selectedImageId !== null}
                    mediaId={selectedImageId}
                    post={post}
                    onClose={() => setSelectedImageId(null)}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
}