import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useComments } from "../../hooks/useComments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

export default function CommentsSection({ postId, onCountChange }) {
    const { user } = useContext(AuthContext);
    const { comments, text, setText, loading, addComment, removeComment } = useComments(postId);

    const handleAddComment = async (e) => {
        const success = await addComment(e);
        if (success)
            onCountChange(1);
    };

    const handleRemoveComment = async (commentId) => {
        const success = await removeComment(commentId);
        if (success)
            onCountChange(-1);
    };

    return (
        <div className="vk-comments-container">
            <CommentForm
                user={user}
                text={text}
                setText={setText}
                onSubmit={handleAddComment}
            />

            <CommentList
                loading={loading}
                comments={comments}
                currentUser={user}
                onDelete={handleRemoveComment}
            />
        </div>
    );
}