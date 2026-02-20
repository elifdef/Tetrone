import { Link } from "react-router-dom";
import { useDateFormatter } from '../../hooks/useDateFormatter';

export default function PostHeader({ post, isOwner, onEdit, onDelete }) {
    const formatDate = useDateFormatter();

    return (
        <div className="socnet-post-header">
            <Link to={`/${post.user.username}`}>
                <img
                    src={post.user.avatar}
                    className="socnet-post-avatar"
                    alt={post.user.username}
                />
            </Link>

            <div className="socnet-post-meta">
                <Link to={`/${post.user.username}`} className="socnet-post-author">
                    {post.user.first_name} {post.user.last_name}
                </Link>
                <Link to={`/post/${post.id}`} className="socnet-post-date">
                    {formatDate(post.created_at)}
                </Link>
            </div>

            {isOwner && onEdit && onDelete && (
                <div className="socnet-post-actions-top">
                    <button className="socnet-action-icon" onClick={() => onEdit(post)}>✎</button>
                    <button className="socnet-action-icon" onClick={() => onDelete(post.id)}>×</button>
                </div>
            )}
        </div>
    );
}