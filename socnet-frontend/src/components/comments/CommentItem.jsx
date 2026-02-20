import { Link } from "react-router-dom";
import { useDateFormatter } from '../../hooks/useDateFormatter';

export default function CommentItem({ comment, currentUser, onDelete }) {
    const isOwner = currentUser && currentUser.id === comment.user.id;
    const formatDate = useDateFormatter();

    return (
        <div className="socnet-comment-item">
            <Link to={`/${comment.user.username}`} className="socnet-comment-img-link">
                <img
                    src={comment.user.avatar}
                    alt={comment.user.username}
                    className="socnet-comment-avatar"
                />
            </Link>

            <div className="socnet-comment-content">
                <div className="socnet-comment-header">
                    <Link to={`/${comment.user.username}`} className="socnet-comment-author">
                        {comment.user.first_name} {comment.user.last_name}
                    </Link>

                    <span className="socnet-comment-date">
                        {formatDate(comment.created_at)}
                    </span>
                </div>

                <div className="socnet-comment-text">
                    {comment.content}
                </div>
            </div>

            {isOwner && (
                <button
                    className="socnet-comment-delete"
                    onClick={() => onDelete(comment.id)}
                >
                    ✕
                </button>
            )}
        </div>
    );
}