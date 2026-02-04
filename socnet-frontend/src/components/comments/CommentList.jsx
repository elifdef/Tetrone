import CommentItem from "./CommentItem";

export default function CommentList({ loading, comments, currentUser, onDelete }) {
    if (loading)
        return <div className="loading-text">Завантаження...</div>;

    if (comments.length === 0)
        return <div className="no-comments">Тут поки немає коментарів.</div>;

    return (
        <div className="vk-comments-list">
            {comments.map(comment => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}