import PostItem from '../post/PostItem';
import EditPostForm from './EditPostForm';

export default function WallPostList({
    posts, authUser, profileUser,
    editingPostId,
    saveEdit, cancelEditing,
    startEditing, handleDelete, handleRepostSuccess
}) {
    const isWallOwner = authUser && profileUser && authUser.id === profileUser.id;

    return (
        <div className="socnet-post-list">
            {posts.map(post => {
                const isAuthor = authUser && post.user && authUser.id === post.user.id;

                return (
                    <div key={post.id}>
                        {editingPostId === post.id ? (
                            <EditPostForm
                                post={post}
                                saveEdit={saveEdit}
                                cancelEditing={cancelEditing}
                            />
                        ) : (
                            <PostItem
                                post={post}
                                isOwner={isAuthor || isWallOwner}
                                onEdit={isAuthor ? startEditing : null}
                                currentUserId={authUser?.id}
                                onDelete={handleDelete}
                                onRepostSuccess={handleRepostSuccess}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}