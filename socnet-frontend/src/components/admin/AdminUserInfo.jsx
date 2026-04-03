import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePageTitle } from "../../hooks/usePageTitle";
import AdminService from '../../services/admin.service';
import { notifySuccess, notifyError } from '../../components/common/Notify';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import { useModal } from '../../context/ModalContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import InfiniteScrollList from "../../components/common/InfiniteScrollList";
import PostItem from "../../components/post/PostItem";

export default function AdminUserInfo() {
    const { username } = useParams();
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // info, posts, comments, likes, sessions
    const { openPrompt, openConfirm } = useModal();
    const formatDate = useDateFormatter();

    usePageTitle(`Admin | ${username}`);

    const fetchUserDetails = async () => {
        setIsLoading(true);
        const res = await AdminService.getUser(username);
        if (res.success) {
            setUser(res.data);
        } else {
            notifyError(res.message || t('admin.user_info.error_load'));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUserDetails();
    }, [username]);

    const handleToggleAction = async (actionType, currentStatus) => {
        const actionText = actionType === 'ban'
            ? (currentStatus ? t('admin.actions.unban') : t('admin.actions.ban'))
            : (currentStatus ? t('admin.actions.unmute') : t('admin.actions.mute'));

        const reason = await openPrompt(t('admin.actions.reason_prompt'), "", actionText, t('common.cancel'));
        if (reason === null) return;

        const finalReason = reason || t('admin.actions.reason_not_specified');

        const res = actionType === 'ban'
            ? await AdminService.toggleBan(username, finalReason)
            : await AdminService.toggleMute(username, finalReason);

        if (res.success) {
            notifySuccess(res.message);
            fetchUserDetails();
        } else {
            notifyError(res.message);
        }
    };

    if (isLoading) return <div className="tetrone-empty-state">{t('common.loading')}</div>;
    if (!user) return <div className="tetrone-empty-state with-card">{t('admin.user_info.not_found')}</div>;

    return (
        <div className="admin-user-wrapper">
            <div className="tetrone-card-wrapper admin-user-card-header">
                <h2 className="admin-user-title">
                    <a href={`/${user.username}`} target="_blank" rel="noreferrer" className="tetrone-link">
                        @{user.username}
                    </a>
                </h2>

                <div className="admin-user-tabs tetrone-tabs">
                    <button className={`tetrone-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                        {t('common.profile', 'Профіль')}
                    </button>
                    <button className={`tetrone-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        {t('common.posts', 'Пости')} ({user.posts_count || 0})
                    </button>
                    <button className={`tetrone-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
                        {t('common.comments', 'Коментарі')} ({user.comments_count || 0})
                    </button>
                    <button className={`tetrone-tab ${activeTab === 'likes' ? 'active' : ''}`} onClick={() => setActiveTab('likes')}>
                        {t('common.likes', 'Лайки')} ({user.likes_count || 0})
                    </button>
                    <button className={`tetrone-tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                        {t('settings.sessions', 'Сесії')}
                    </button>
                </div>
            </div>

            <div className="admin-user-tab-content">
                {activeTab === 'info' && (
                    <TabInfo user={user} formatDate={formatDate} handleToggleAction={handleToggleAction} t={t} />
                )}
                {activeTab === 'posts' && <TabPosts username={username} t={t} />}
                {activeTab === 'comments' && <TabComments username={username} t={t} />}
                {activeTab === 'likes' && <TabLikes username={username} t={t} />}
                {activeTab === 'sessions' && <TabSessions username={username} t={t} formatDate={formatDate} openConfirm={openConfirm} />}
            </div>
        </div>
    );
}

const TabInfo = ({ user, formatDate, handleToggleAction, t }) => (
    <>
        <div className="tetrone-card-wrapper">
            <div className="admin-user-row">
                <div className="admin-user-col">
                    <p className="admin-info-item"><span className="admin-info-label">ID:</span> {user.id}</p>
                    <p className="admin-info-item"><span className="admin-info-label">{t('admin.user_info.email_label')}:</span> {user.email}</p>
                    <p className="admin-info-item"><span className="admin-info-label">{t('common.first_name')}:</span> {user.first_name}</p>
                    <p className="admin-info-item"><span className="admin-info-label">{t('common.last_name')}:</span> {user?.last_name}</p>
                    <p className="admin-info-item"><span className="admin-info-label">{t('admin.user_info.registered_at')}:</span> {formatDate(user.created_at)}</p>
                    <p className="admin-info-item"><span className="admin-info-label">{t('admin.user_info.last_active')}:</span> {user.last_seen ? formatDate(user.last_seen) : t('admin.user_info.never')}</p>
                    <p className="admin-info-item"><span className="admin-info-label">{t('common.role')}:</span> {user.role}</p>
                    <p className="admin-info-item">
                        <span className="admin-info-label">{t('admin.user_info.account_status')}:</span>
                        {user.is_banned ? <span className="admin-status-red"> {t('admin.user_info.status_banned')}</span> : <span className="admin-status-green"> {t('admin.user_info.status_active')}</span>}
                        {user.is_muted && <span className="admin-status-orange"> {t('admin.user_info.status_muted')}</span>}
                    </p>
                </div>
                <div className="admin-actions-box">
                    <h4 className="admin-actions-title">{t('admin.actions.title')}</h4>
                    <div className="admin-btn-group">
                        <Button
                            className={`admin-btn admin-btn-warning ${user.is_muted ? 'active' : ''}`} onClick={() => handleToggleAction('mute', user.is_muted)}
                        >
                            {user.is_muted ? t('admin.actions.unmute') : t('admin.actions.mute')}
                        </Button>
                        <Button
                            className={`admin-btn admin-btn-danger ${user.is_banned ? 'active' : ''}`}
                            onClick={() => handleToggleAction('ban', user.is_banned)}
                        >
                            {user.is_banned ? t('admin.actions.unban') : t('admin.actions.ban')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <div className="tetrone-card-wrapper admin-table-card mt-3">
            <h3 className="admin-table-title">{t('admin.user_info.violation_history')}</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>{t('common.date')}</th>
                        <th>{t('admin.user_info.action')}</th>
                        <th>{t('admin.user_info.reason')}</th>
                    </tr>
                </thead>
                <tbody>
                    {user.moderation_logs && user.moderation_logs.length > 0 ? (
                        user.moderation_logs.map(log => {
                            const isPositive = log.action.includes('un');
                            return (
                                <tr key={log.id}>
                                    <td>{formatDate(log.created_at)}</td>
                                    <td><span className={`admin-badge ${isPositive ? 'admin-badge-positive' : 'admin-badge-negative'}`}>{log.action.toUpperCase()}</span></td>
                                    <td className="admin-reason-cell">{log.reason}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr><td colSpan="3" className="admin-table-empty-row">{t('admin.user_info.no_violations')}</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </>
);

const TabPosts = ({ username, t }) => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        setLoading(true);
        const res = await AdminService.getUserPosts(username, page);
        if (res.success) {
            const newPosts = res.data || [];
            setPosts(prev => page === 1 ? newPosts : [...prev, ...newPosts]);
            setHasMore(res.meta ? res.meta.current_page < res.meta.last_page : false);
        }
        setLoading(false);
    };

    useEffect(() => { fetchPosts(); }, [page]);

    return (
        <InfiniteScrollList
            itemsCount={posts.length}
            isLoadingInitial={loading && page === 1}
            isLoadingMore={loading && page > 1}
            hasMore={hasMore}
            onLoadMore={() => setPage(p => p + 1)}
            emptyState={<div className="tetrone-empty-state">{t('common.no_more_data')}</div>}
        >
            {posts.map(post => <PostItem key={post.id} post={post} />)}
        </InfiniteScrollList>
    );
};

const TabComments = ({ username, t }) => {
    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        setLoading(true);
        const res = await AdminService.getUserComments(username, page);
        if (res.success) {
            setComments(prev => page === 1 ? (res.data || []) : [...prev, ...(res.data || [])]);
            setHasMore(res.meta ? res.meta.current_page < res.meta.last_page : false);
        }
        setLoading(false);
    };

    useEffect(() => { fetchComments(); }, [page]);

    return (
        <InfiniteScrollList
            itemsCount={comments.length}
            isLoadingInitial={loading && page === 1}
            isLoadingMore={loading && page > 1}
            hasMore={hasMore}
            onLoadMore={() => setPage(p => p + 1)}
            emptyState={<div className="tetrone-empty-state">{t('common.no_more_data')}</div>}
        >
            {comments.map(c => (
                <div key={c.id} className="tetrone-card-wrapper" style={{ padding: '15px', marginBottom: '10px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '5px' }}>
                        ID Поста: {c.post_id}
                    </div>
                    <div>{c.content}</div>
                </div>
            ))}
        </InfiniteScrollList>
    );
};

const TabLikes = ({ username, t }) => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    const fetchLikes = async () => {
        setLoading(true);
        const res = await AdminService.getUserLikes(username, page);
        if (res.success) {
            setPosts(prev => page === 1 ? (res.data || []) : [...prev, ...(res.data || [])]);
            setHasMore(res.meta ? res.meta.current_page < res.meta.last_page : false);
        }
        setLoading(false);
    };

    useEffect(() => { fetchLikes(); }, [page]);

    return (
        <InfiniteScrollList
            itemsCount={posts.length}
            isLoadingInitial={loading && page === 1}
            isLoadingMore={loading && page > 1}
            hasMore={hasMore}
            onLoadMore={() => setPage(p => p + 1)}
            emptyState={<div className="tetrone-empty-state">{t('common.no_more_data')}</div>}
        >
            {posts.map(post => <PostItem key={post.id} post={post} />)}
        </InfiniteScrollList>
    );
};

const TabSessions = ({ username, t, formatDate, openConfirm }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        setLoading(true);
        const res = await AdminService.getUserSessions(username);
        if (res.success) setSessions(res.data || []);
        setLoading(false);
    };

    useEffect(() => { fetchSessions(); }, []);

    if (loading) return <div className="tetrone-empty-state">{t('common.loading')}</div>;
    if (sessions.length === 0) return <div className="tetrone-empty-state">{t('admin.user_info.history_empty')}</div>;

    return (
        <div className="tetrone-card-wrapper admin-table-card">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>{t('admin.user_info.ip_address')}</th>
                        <th>{t('admin.user_info.device')}</th>
                        <th>{t('admin.user_info.last_active')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map(s => (
                        <tr key={s.id}>
                            <td>{s.id}</td>
                            <td><strong className="admin-ip-text">{s.ip_address}</strong></td>
                            <td title={s.user_agent}>{s.user_agent}</td>
                            <td>{formatDate(s.last_used_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};