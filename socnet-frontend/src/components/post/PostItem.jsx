import { usePostLike } from "../../hooks/usePostLike";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PostFooter from "./PostFooter";

export default function PostItem({ post, onEdit, onDelete, isOwner}) {
    const { isLiked, likesCount, handleLike } = usePostLike(post);

    return (
        <div className="vk-post">
            <PostHeader
                post={post}
                isOwner={isOwner}
                onEdit={onEdit}
                onDelete={onDelete}
            />

            <PostContent
                content={post.content}
                image={post.image}
            />

            <PostFooter
                postId={post.id}
                isLiked={isLiked}
                likesCount={likesCount}
                commentsCount={post.comments_count}
                onLike={handleLike}
            />
        </div>
    );
}