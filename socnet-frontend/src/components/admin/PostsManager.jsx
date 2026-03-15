import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import PostService from '../../services/post.service';
import { notifySuccess, notifyError } from "../common/Notify";
import { useModal } from '../../context/ModalContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import Button from '../UI/Button';
import Input from '../UI/Input';
import PostContent from '../post/content/PostContent';
import PostFooter from '../post/PostFooter';
import PostItem from '../post/PostItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { userRole } from '../../config';

export const PostsManager = ({ currentUser }) => {
    const { t } = useTranslation();
    const { openPrompt } = useModal();
    const formatDate = useDateFormatter();

    const [posts, setPosts] = useState([]);
    const [targetUser, setTargetUser] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const isAdmin = currentUser.role === userRole.Admin;

    const fetchPosts = async (username = '', pageNum = 1, append = false) => {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);

        try {
            const { items, meta } = await AdminService.getPosts(username, pageNum);

            if (append) {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueItems = items.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueItems];
                });
            } else {
                setPosts(items);
            }

            setHasMore(meta ? meta.current_page < meta.last_page : false);
        } catch (error) {
            notifyError(t('error.loading', { resource: 'posts' }));
            console.error('Failed to load admin posts:', error.data?.message || error.message);
        } finally {
            if (append) setIsLoadingMore(false);
            else setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts('', 1, false);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchPosts(targetUser, 1, false);
    };

    const loadMore = () => {
        if (!isLoadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(targetUser, nextPage, true);
        }
    };

    const handleDelete = async (postId) => {
        const reason = await openPrompt(
            t('admin.posts.delete_reason'),
            "",
            t('common.delete'),
            t('common.cancel')
        );

        if (reason === null) return;

        try {
            await PostService.delete(postId, { reason });

            setPosts(prev => prev.filter(post => post.id !== postId));
            notifySuccess(t('common.deleted'));
        } catch (error) {
            notifyError(error.data?.message || t('error.deleting'));
        }
    };

    const handleEdit = (postId) => {
        alert(t('admin.common.under_construction'));
    };

    return (
        <div className="admin-posts-manager">
            <form onSubmit={handleSearch} className="admin-search-bar admin-post-search">
                <div className="admin-post-search-input">
                    <Input
                        label={t('admin.posts.filter_label')}
                        type="text"
                        placeholder={t('admin.posts.filter_placeholder')}
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                    />
                </div>
                <Button type="submit">{t('common.find')}</Button>
            </form>

            <InfiniteScrollList
                className="socnet-feed-list admin-feed-wrapper"
                itemsCount={posts.length}
                isLoadingInitial={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                error={false}
                onRetry={() => fetchPosts(targetUser, page, false)}
                emptyState={
                    <div className="socnet-empty-state with-card">
                        <h3 className="socnet-empty-title">{t('post.posts_not_found')}</h3>
                        <p className="socnet-empty-desc">{t('admin.posts.not_found_desc')}</p>
                    </div>
                }
            >
                {posts.map(post => {
                    const isFemale = post.user?.gender === 2;
                    const wallKey = isFemale ? 'post.wrote_on_wall_female' : 'post.wrote_on_wall_male';
                    const showTargetUser = post.target_user && post.target_user.username !== post.user?.username;

                    return (
                        <div key={post.id} className="socnet-post admin-moderation-post">
                            <div className="socnet-post-header">
                                <Link to={`/${post.user?.username}`} target="_blank">
                                    <img src={post.user?.avatar} alt={post.user?.username} className="socnet-post-avatar" />
                                </Link>
                                <div className="socnet-post-meta">
                                    <div className="socnet-post-authors-row">
                                        <Link to={`/${post.user?.username}`} className="socnet-post-author" target="_blank">
                                            {post.user?.first_name} {post.user?.last_name}
                                        </Link>

                                        {showTargetUser && (
                                            <span className="socnet-post-target-text">
                                                {` ${t(wallKey)} `}
                                                <Link to={`/${post.target_user.username}`} className="socnet-post-author target" target="_blank">
                                                    {post.target_user.first_name} {post.target_user.last_name}
                                                </Link>
                                            </span>
                                        )}
                                    </div>
                                    <span className="socnet-post-date">
                                        {t('common.id')}: {post.id} • {formatDate(post.created_at)}
                                    </span>
                                </div>

                                <div className="socnet-post-actions-top admin-post-actions-visible">
                                    {isAdmin && (
                                        <button
                                            className="socnet-action-icon"
                                            onClick={() => handleEdit(post.id)}
                                            title={t('common.edit')}
                                        >
                                            ✎
                                        </button>
                                    )}
                                    <button
                                        className="socnet-post-delete"
                                        onClick={() => handleDelete(post.id)}
                                        title={t('common.delete')}
                                    >
                                        ✖
                                    </button>
                                </div>
                            </div>

                            <PostContent content={post.content} post={post} onUpdate={() => { }} />

                            {post.is_repost && (
                                <div className="socnet-repost-branch">
                                    {post.original_post_id && post.original_post ? (
                                        <PostItem
                                            post={post.original_post}
                                            isInner={true}
                                            readonly={true}
                                        />
                                    ) : (
                                        <div className="socnet-deleted-stub">
                                            {t('post.original_deleted')}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="admin-footer-wrapper">
                                <PostFooter
                                    postId={post.id}
                                    isLiked={false}
                                    likesCount={post.likes_count || 0}
                                    commentsCount={post.comments_count || 0}
                                    repostsCount={post.reposts_count || 0}
                                    readonly={true}
                                />
                            </div>
                        </div>
                    );
                })}
            </InfiniteScrollList>
        </div>
    );
};