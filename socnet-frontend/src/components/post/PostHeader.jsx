import { Link } from "react-router-dom";

export default function PostHeader({ post, isOwner, onEdit, onDelete }) {
    return (
        <div className="vk-post-header">
            <Link to={`/${post.user.username}`}>
                <img
                    src={post.user.avatar}
                    className="vk-post-avatar"
                    alt="Avatar"
                />
            </Link>

            <div className="vk-post-meta">
                <Link to={`/${post.user.username}`} className="vk-post-author">
                    {post.user.first_name} {post.user.last_name}
                </Link>
                <Link to={`/post/${post.id}`} className="vk-post-date">
                    {new Date(post.created_at).toLocaleString()}
                </Link>
            </div>

            {isOwner && onEdit && onDelete && (
                <div className="vk-post-actions-top">
                    <button className="vk-action-icon" onClick={() => onEdit(post)}>✎</button>
                    <button className="vk-action-icon" onClick={() => onDelete(post.id)}>×</button>
                </div>
            )}
        </div>
    );
}