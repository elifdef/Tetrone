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
    const wallData = useUserWall(profileUser);
    const { t } = useTranslation();

    const canWriteOnWall = authUser && (isOwnProfile || profileUser.friendship_status !== "blocked_by_target");

    return (
        <div className="socnet-wall">
            <WallHeader postsCount={wallData.countPosts} />

            {canWriteOnWall && (<CreatePostForm onSubmitSuccess={wallData.createPost} />)}

            <InfiniteScrollList
                itemsCount={wallData.posts.length}
                isLoadingInitial={wallData.isPageLoading}
                isLoadingMore={wallData.isLoadingMore}
                hasMore={wallData.hasMore}
                onLoadMore={wallData.loadMore}
                emptyState={
                    <div className="socnet-empty-state with-card">
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