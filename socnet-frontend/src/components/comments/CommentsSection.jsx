import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useComments } from "./hooks/useComments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import { useTranslation } from 'react-i18next';

export default function CommentsSection({ postId, onCountChange }) {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [replyToUser, setReplyToUser] = useState(null);

    const { comments, isLoadingInitial, isLoadingMore, hasMore, error, loadMore, fetchComments, addComment, removeComment, editComment } = useComments(postId);

    const handleAddComment = async (content) => {
        const success = await addComment(content);
        if (success)
            onCountChange(1);
        return success;
    };

    const handleRemoveComment = async (commentId) => {
        const success = await removeComment(commentId);
        if (success) {
            onCountChange(-1);
        }
    };

    return (
        <div className="tetrone-comments-container">
            <CommentForm
                user={user}
                onSubmit={handleAddComment}
                placeholder={t('action.comment')}
                replyToUser={replyToUser}
                onClearReply={() => setReplyToUser(null)}
            />

            <CommentList
                comments={comments}
                currentUser={user}
                onDelete={handleRemoveComment}
                noCommentsText={t('empty.comments')}
                isLoadingInitial={isLoadingInitial}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                error={error}
                onLoadMore={loadMore}
                onRetry={fetchComments}
                onReply={setReplyToUser}
                onEdit={editComment}
            />
        </div>
    );
}