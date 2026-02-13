import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useUserWall } from '../../hooks/useUserWall';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import WallHeader from './WallHeader';
import CreatePostForm from './CreatePostForm';
import WallPostList from './WallPostList';
import { useTranslation } from 'react-i18next';

export default function UserWall({ profileUser, isOwnProfile }) {
    const { user: authUser } = useContext(AuthContext);
    const { t } = useTranslation();
    const wallData = useUserWall(profileUser);

    const loaderRef = useIntersectionObserver(
        wallData.loadMore,
        wallData.hasMore,
        wallData.isLoadingMore
    );

    return (
        <div className="vk-wall">
            <WallHeader
                postsCount={wallData.posts.length}
            />

            {isOwnProfile && (
                <CreatePostForm
                    content={wallData.content}
                    setContent={wallData.setContent}
                    preview={wallData.preview}
                    removeImage={wallData.removeImage}
                    isDragging={wallData.isDragging}
                    handleDragOver={wallData.handleDragOver}
                    handleDragLeave={wallData.handleDragLeave}
                    handleDrop={wallData.handleDrop}
                    handleFileSelect={wallData.handleFileSelect}
                    handlePaste={wallData.handlePaste}
                    handleSubmit={wallData.handleSubmit}
                />
            )}

            <WallPostList
                posts={wallData.posts}
                authUser={authUser}
                editingPostId={wallData.editingPostId}
                editContent={wallData.editContent}
                setEditContent={wallData.setEditContent}
                editPreview={wallData.editPreview}
                removeEditImage={wallData.removeEditImage}
                handleEditFileSelect={wallData.handleEditFileSelect}
                handlePaste={wallData.handlePaste}
                saveEdit={wallData.saveEdit}
                cancelEditing={wallData.cancelEditing}
                startEditing={wallData.startEditing}
                handleDelete={wallData.handleDelete}
            />

            {wallData.hasMore && (
                <div
                    ref={loaderRef}
                    style={{ padding: '20px', textAlign: 'center', color: 'var(--theme-text-muted)', fontSize: '12px' }}
                >
                    {wallData.isLoadingMore ? t('common.loading') + '...' : ''}
                </div>
            )}

            {!wallData.hasMore && wallData.posts.length > 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--theme-text-muted)', fontSize: '11px' }}>
                    {t('wall.no_posts')}

                </div>
            )}
        </div>
    );
}