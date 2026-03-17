import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import PostService from '../../services/post.service';
import { notifySuccess, notifyError } from "../common/Notify";
import { useModal } from '../../context/ModalContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { AuthContext } from "../../context/AuthContext";
import { useContext } from 'react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import PostContent from '../post/content/PostContent';
import PostFooter from '../post/PostFooter';
import PostItem from '../post/PostItem';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { userRole } from '../../config';
import { usePageTitle } from "../../hooks/usePageTitle";

const UserSearchForm = ({ search, setSearch, handleSearch }) => {
    const { t } = useTranslation();
    return (
        <form onSubmit={handleSearch} className="admin-search-bar admin-user-search">
            <div className="admin-post-search-input">
                <Input
                    label={t('admin.search_user')}
                    type="text"
                    className="socnet-form-input"
                    placeholder={t('admin.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button type="submit">{t('common.find')}</Button>
        </form>
    );
};

const UserCard = ({ user, handleMute, handleBan, canBan }) => {
    const { t } = useTranslation();
    const { user: currentAdmin } = useContext(AuthContext);
    const isAdmin = currentAdmin?.role === userRole.Admin;
    const profilePath = `/${isAdmin ? 'admin/users/' : ''}${user.username}`;

    return (
        <div className="admin-user-card">
            <img src={user.avatar} alt={user.username} className="admin-user-avatar" />
            <div className="admin-user-info">
                <a href={profilePath} className="admin-user-name" target="_blank" rel="noreferrer">
                    {user.first_name} {user.last_name}
                </a>
                <div className="admin-user-meta">
                    {`@${user.username} • ${user.email} • ${t('admin.user_info.posts_count', { count: user.posts_count || 0 })}`}
                </div>
                <div className="admin-user-status">
                    {user.is_banned ? (
                        <span className="admin-status-banned">{t('admin.user_info.status_banned_full')}</span>
                    ) : user.is_muted ? (
                        <span className="admin-status-muted">{t('admin.read_only')}</span>
                    ) : null}
                </div>
            </div>
            {user.role <= userRole.Moderator && (
                <div className="admin-user-actions">
                    <button
                        className={`admin-btn admin-btn-warning ${user.is_muted ? 'active' : ''}`}
                        onClick={() => handleMute(user.username, user.is_muted)}
                    >
                        {user.is_muted ? t('admin.allow_posting') : t('admin.forbid_posting')}
                    </button>
                    {canBan && (
                        <button
                            className={`admin-btn admin-btn-danger ${user.is_banned ? 'active' : ''}`}
                            onClick={() => handleBan(user.username, user.is_banned)}
                        >
                            {user.is_banned ? t('admin.actions.unban') : t('admin.actions.ban')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export const UsersManager = ({ canBan = true }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { openPrompt } = useModal();

    usePageTitle(t('admin.users_management'));

    const fetchUsers = async (searchQuery = '') => {
        setIsLoading(true);
        const res = await AdminService.getUsers(searchQuery);

        if (res.success) {
            setUsers(res.data || []);
        } else {
            notifyError(res.message);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(search);
    };

    const handleMute = async (username, currentStatus) => {
        const reason = await openPrompt(
            t('admin.actions.reason_prompt'), "",
            currentStatus ? t('admin.actions.unmute') : t('admin.read_only'), t('common.cancel')
        );

        if (reason === null) return;

        const res = await AdminService.toggleMute(username, reason);

        if (res.success) {
            setUsers(prevUsers => prevUsers.map(u => u.username === username ? { ...u, is_muted: !currentStatus } : u));
            notifySuccess(res.message);
        } else {
            notifyError(res.message);
        }
    };

    const handleBan = async (username, currentStatus) => {
        const reason = await openPrompt(
            t('admin.actions.reason_prompt'), "",
            currentStatus ? t('admin.actions.unban') : t('admin.actions.ban'), t('common.cancel')
        );

        if (reason === null) return;

        const res = await AdminService.toggleBan(username, reason);

        if (res.success) {
            setUsers(prevUsers => prevUsers.map(u => u.username === username ? { ...u, is_banned: !currentStatus } : u));
            notifySuccess(res.message);
        } else {
            notifyError(res.message);
        }
    };

    return (
        <div className="admin-users-manager-wrapper">
            <UserSearchForm search={search} setSearch={setSearch} handleSearch={handleSearch} />

            {isLoading ? (
                <div className="socnet-empty-state">{t('common.loading')}</div>
            ) : (
                <div className="admin-users-list">
                    {users.map(user => (
                        <UserCard key={user.id} user={user} handleMute={handleMute} handleBan={handleBan} canBan={canBan} />
                    ))}
                    {users.length === 0 && (
                        <div className="socnet-empty-state with-card">{t('admin.users_not_found')}</div>
                    )}
                </div>
            )}
        </div>
    );
};

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

        const res = await AdminService.getPosts(username, pageNum);

        if (res.success) {
            const items = res.data || [];
            const meta = res.meta;

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
        } else {
            notifyError(res.message);
        }

        if (append) setIsLoadingMore(false);
        else setIsLoading(false);
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
            t('admin.posts.delete_reason'), "", t('common.delete'), t('common.cancel')
        );

        if (reason === null) return;

        const res = await PostService.delete(postId, { reason });

        if (res.success) {
            setPosts(prev => prev.filter(post => post.id !== postId));
            notifySuccess(res.message);
        } else {
            notifyError(res.message);
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
                                        <button className="socnet-action-icon" onClick={() => handleEdit(post.id)} title={t('common.edit')}>
                                            ✎
                                        </button>
                                    )}
                                    <button className="socnet-post-delete" onClick={() => handleDelete(post.id)} title={t('common.delete')}>
                                        ✖
                                    </button>
                                </div>
                            </div>

                            <PostContent content={post.content} post={post} onUpdate={() => { }} />

                            {post.is_repost && (
                                <div className="socnet-repost-branch">
                                    {post.original_post_id && post.original_post ? (
                                        <PostItem post={post.original_post} isInner={true} readonly={true} />
                                    ) : (
                                        <div className="socnet-deleted-stub">{t('post.original_deleted')}</div>
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