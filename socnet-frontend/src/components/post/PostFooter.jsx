import { Link } from "react-router-dom";
import CommentIcon from "../../assets/comment.svg?react";
import NoCommentIcon from "../../assets/nocomment.svg?react";
import Like from "../../assets/like.svg?react";
import NoLike from "../../assets/nolike.svg?react";

export default function PostFooter({ postId, isLiked, likesCount, commentsCount, onLike }) {
    return (
        <div className="vk-post-footer">
            <button
                className={`vk-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={onLike}>

                {isLiked ? (
                    <Like width={16} height={16} />
                ) : (
                    <NoLike width={16} height={16} />
                )}

                <span>{likesCount > 0 ? likesCount : 'Подобається'}</span>
            </button>

            <Link to={`/post/${postId}`} className="vk-comment-btn">
                {commentsCount > 0
                    ? <><CommentIcon width={16} height={16} />{commentsCount}</>
                    : <><NoCommentIcon width={16} height={16} />Коментувати</>}
            </Link>
        </div>
    );
}