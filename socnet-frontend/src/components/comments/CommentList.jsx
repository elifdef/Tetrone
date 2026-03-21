import CommentItem from './CommentItem';
import InfiniteScrollList from '../common/InfiniteScrollList';

export default function CommentList({
    comments,
    currentUser,
    onDelete,
    onEdit,
    onReply,
    noCommentsText,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    error,
    onLoadMore,
    onRetry
}) {
    return (
        <InfiniteScrollList
            itemsCount={comments.length}
            isLoadingInitial={isLoadingInitial}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            error={error}
            onRetry={onRetry}
            className="socnet-comments-list"
            emptyState={
                <div className="socnet-empty-state">
                    <p>{noCommentsText}</p>
                </div>
            }
        >
            {comments.map(comment => (
                <CommentItem
                    key={comment.uid || comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReply={onReply}
                />
            ))}
        </InfiniteScrollList>
    );
}