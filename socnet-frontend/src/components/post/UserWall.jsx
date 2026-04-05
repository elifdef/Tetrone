import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { useUserWall } from './hooks/useUserWall';
import WallHeader from './WallHeader';
import CreatePostForm from './CreatePostForm';
import WallPostList from './WallPostList';
import InfiniteScrollList from '../common/InfiniteScrollList';

export default function UserWall({ profileUser, isOwnProfile }) {
    const { user: authUser } = useContext(AuthContext);
    const { t } = useTranslation();

    if (profileUser.is_private && !isOwnProfile) {
        return null;
    }

    const wallData = useUserWall(profileUser);
    const canWriteOnWall = Boolean(profileUser.permissions?.can_post_on_wall);

    return (
        <div className="tetrone-wall">
            <WallHeader postsCount={wallData.countPosts} />

            {canWriteOnWall ? (
                <CreatePostForm onSubmitSuccess={wallData.createPost} />
            ) : (
                authUser && !isOwnProfile && (
                    <div className="tetrone-empty-state with-card tetrone-mb-15">
                        <span className="tetrone-text-muted">{t('privacy.wall_posting_disabled')}</span>
                    </div>
                )
            )}

            <InfiniteScrollList
                itemsCount={wallData.posts.length}
                isLoadingInitial={wallData.isPageLoading}
                isLoadingMore={wallData.isLoadingMore}
                hasMore={wallData.hasMore}
                onLoadMore={wallData.loadMore}
                emptyState={
                    <div className="tetrone-empty-state with-card">
                        {t('wall.no_posts')}
                    </div>
                }
            >
                <WallPostList
                    posts={wallData.posts}
                    authUser={authUser}
                    profileUser={profileUser}
                    editingPostId={wallData.editingPostId}
                    saveEdit={wallData.saveEdit}
                    cancelEditing={wallData.cancelEditing}
                    startEditing={wallData.startEditing}
                    handleDelete={wallData.handleDelete}
                    handleRepostSuccess={wallData.handleRepostSuccess}
                />
            </InfiniteScrollList>
        </div>
    );
}