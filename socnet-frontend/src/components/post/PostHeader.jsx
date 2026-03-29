import { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { EditIcon, DeleteIcon, ReportIcon, DotsIcon } from '../ui/Icons';

export default function PostHeader({ post, isOwner, onEdit, onDelete, onReport, currentUserId }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { username: currentProfileUsername } = useParams();

    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showMenu && !e.target.closest('.tetrone-post-actions-container')) {
                setShowMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMenu]);

    const isAvatarUpdate = post.is_avatar_update === true;
    const showTargetUser = !isAvatarUpdate && post.target_user && post.target_user.username !== currentProfileUsername;
    const isAuthor = currentUserId ? currentUserId == post.user?.id : isOwner;

    const authorNameColor = post.user?.personalization?.username_color;
    const targetNameColor = post.target_user?.personalization?.username_color;

    const canEdit = onEdit && isAuthor && !isAvatarUpdate;
    const canDelete = onDelete && isOwner;
    const canReport = onReport && !isAuthor;

    const showActions = canEdit || canDelete || canReport;

    const avatarUpdateText = post.user?.gender === 2
        ? t('post.updated_avatar_female')
        : t('post.updated_avatar_male');

    return (
        <div className="tetrone-post-header">
            <Link to={`/${post.user.username}`}>
                <img
                    src={post.user.avatar}
                    className="tetrone-post-avatar"
                    alt={post.user.username}
                />
            </Link>

            <div className="tetrone-post-meta">
                <div className="tetrone-post-authors-row">
                    <Link
                        to={`/${post.user.username}`}
                        className="tetrone-post-author"
                        style={authorNameColor ? { color: authorNameColor } : undefined}
                    >
                        {post.user.first_name} {post.user.last_name}
                    </Link>

                    {isAvatarUpdate && (
                        <span className="tetrone-post-target-text">
                            {' '}{avatarUpdateText}
                        </span>
                    )}

                    {showTargetUser && (
                        <span className="tetrone-post-target-text">
                            {' '}{t(`post.wrote_on_wall_${post.user.gender === 2 ? 'female' : 'male'}`)}{' '}
                            <Link to={`/${post.target_user.username}`} className="tetrone-post-author target">
                                {post.target_user.first_name} {post.target_user.last_name}
                            </Link>
                        </span>
                    )}
                </div>

                <Link to={`/post/${post.id}`} className="tetrone-post-date">
                    {formatDate(post.created_at)}
                </Link>
            </div>

           {showActions && (
                <div className="tetrone-post-actions-container" style={{ position: 'relative', marginLeft: 'auto' }}>
                    <button
                        className="tetrone-post-action-btn-trigger"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <DotsIcon width={20} height={20} />
                    </button>

                    {showMenu && (
                        <div className="tetrone-actions-dropdown">
                            {canEdit && (
                                <button onClick={() => { onEdit(post); setShowMenu(false); }}>
                                    <EditIcon /> {t('common.edit')}
                                </button>
                            )}
                            {canDelete && (
                                <button className="danger" onClick={() => { onDelete(post.id); setShowMenu(false); }}>
                                    <DeleteIcon /> {t('common.delete')}
                                </button>
                            )}
                            {canReport && (
                                <button className="warning" onClick={() => { onReport(post.id); setShowMenu(false); }}>
                                    <ReportIcon /> {t('reports.title')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}