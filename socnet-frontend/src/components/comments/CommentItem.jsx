import { Link } from "react-router-dom";

export default function CommentItem({ comment, currentUser, onDelete }) {
    const isOwner = currentUser && currentUser.id === comment.user.id;

    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('uk-UA', options);
    };

    return (
        <div className="vk-comment-item">
            <Link to={`/${comment.user.username}`} className="vk-comment-img-link">
                <img 
                    src={comment.user.avatar} 
                    alt={comment.user.username} 
                    className="vk-comment-avatar" 
                />
            </Link>

            <div className="vk-comment-content">
                <div className="vk-comment-header">
                    <Link to={`/${comment.user.username}`} className="vk-comment-author">
                        {comment.user.first_name} {comment.user.last_name}
                    </Link>
                    
                    <span className="vk-comment-date">
                        {formatDate(comment.created_at)}
                    </span>
                </div>

                <div className="vk-comment-text">
                    {comment.content}
                </div>
            </div>

            {isOwner && (
                <button
                    className="vk-comment-delete"
                    onClick={() => onDelete(comment.id)}
                    title="Видалити"
                >
                    ✕
                </button>
            )}
        </div>
    );
}