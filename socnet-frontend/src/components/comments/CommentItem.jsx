import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { EditIcon, DeleteIcon, ReplyIcon, ReportIcon, DotsIcon } from './CommentIcons';
import ReportModal from '../common/ReportModal';
import "../../styles/comment.css"
import RichText from '../common/RichText';

export default function CommentItem({ comment, currentUser, onDelete, onEdit, onReply }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const location = useLocation();
    const commentRef = useRef(null);

    // якщо автор коментаря - редагувати/видаляти. 
    const isOwner = currentUser && currentUser.id === comment.user.id;
    const canReport = currentUser && !isOwner;

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showMenu && !e.target.closest('.socnet-comment-actions-container')) {
                setShowMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMenu]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const targetUid = params.get('comment');

        if (targetUid === comment.uid) {
            setIsHighlighted(true);
            commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const timer = setTimeout(() => setIsHighlighted(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [location.search, comment.uid]);

    const handleSave = async () => {
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false);
            return;
        }
        const success = await onEdit(comment.uid, editContent);
        if (success) setIsEditing(false);
    };

    return (
        <div ref={commentRef} className={`socnet-comment-item ${isHighlighted ? 'socnet-highlight-msg' : ''}`}>
            <Link to={`/${comment.user.username}`} className="socnet-comment-img-link">
                <img src={comment.user.avatar} alt={comment.user.username} className="socnet-comment-avatar" />
            </Link>

            <div className="socnet-comment-content">
                <div className="socnet-comment-header">
                    <Link to={`/${comment.user.username}`} className="socnet-comment-author">
                        {comment.user.first_name} {comment.user.last_name}
                    </Link>
                    <span className="socnet-comment-date">
                        {formatDate(comment.created_at)}
                    </span>
                </div>

                {isEditing ? (
                    <div className="socnet-edit-mode-comment">
                        <textarea
                            className="socnet-edit-textarea"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="socnet-edit-buttons-right">
                            <button className="socnet-btn socnet-btn-small" onClick={handleSave}>
                                {t('common.save')}
                            </button>
                            <button className="socnet-btn socnet-btn-small socnet-btn-cancel" onClick={() => setIsEditing(false)}>
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <RichText text={comment.content} className="socnet-comment-text" />
                )}

                {currentUser && !isEditing && (
                    <div className="socnet-comment-reply-wrapper">
                        <button className="socnet-comment-reply-btn" onClick={() => onReply(comment.user)}>
                            <ReplyIcon /> {t('common.reply')}
                        </button>
                    </div>
                )}
            </div>

            {(isOwner || canReport) && !isEditing && (
                <div className="socnet-comment-actions-container">
                    <button
                        className="socnet-comment-action-btn-trigger"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <DotsIcon />
                    </button>

                    {showMenu && (
                        <div className="socnet-actions-dropdown">
                            {isOwner && (
                                <>
                                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                                        <EditIcon /> {t('common.edit')}
                                    </button>
                                    <button className="danger" onClick={() => { onDelete(comment.uid); setShowMenu(false); }}>
                                        <DeleteIcon /> {t('common.delete')}
                                    </button>
                                </>
                            )}
                            {canReport && (
                                <button className="warning" onClick={() => { setIsReportModalOpen(true); setShowMenu(false); }}>
                                    <ReportIcon /> {t('reports.title', 'Поскаржитись')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isReportModalOpen && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    targetType="comment"
                    targetId={comment.id}
                />
            )}
        </div>
    );
}