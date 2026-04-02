import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { EditIcon, DeleteIcon, ReplyIcon, ReportIcon, DotsIcon } from '../ui/Icons';
import ReportModal from '../modals/ReportModal';
import RichText from '../common/RichText';
import Editor from '../editor/Editor';
import { isEditorEmpty } from '../../utils/editorHelpers';

export default function CommentItem({ comment, currentUser, onDelete, onEdit, onReply }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const location = useLocation();
    const commentRef = useRef(null);

    const isOwner = currentUser && currentUser.id === comment.user.id;
    const canReport = currentUser && !isOwner;

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showMenu && !e.target.closest('.tetrone-comment-actions-container')) {
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
        if (isEditorEmpty(editContent) || JSON.stringify(editContent) === JSON.stringify(comment.content)) {
            setIsEditing(false);
            return;
        }
        const success = await onEdit(comment.uid, editContent);
        if (success) setIsEditing(false);
    };

    return (
        <div ref={commentRef} className={`tetrone-comment-item ${isHighlighted ? 'tetrone-highlight-msg' : ''}`}>
            <Link to={`/${comment.user.username}`} className="tetrone-comment-img-link">
                <img src={comment.user.avatar} alt={comment.user.username} className="tetrone-comment-avatar" />
            </Link>

            <div className="tetrone-comment-content">
                <div className="tetrone-comment-header">
                    <Link to={`/${comment.user.username}`} className="tetrone-comment-author">
                        {comment.user.first_name} {comment.user.last_name}
                    </Link>
                    <span className="tetrone-comment-date">
                        {formatDate(comment.created_at)}
                    </span>
                </div>

                {isEditing ? (
                    <div className="tetrone-edit-mode-comment">
                        <Editor
                            className="tetrone-edit-textarea"
                            value={editContent}
                            onChange={setEditContent}
                        />
                        <div className="tetrone-edit-buttons-right">
                            <button className="tetrone-btn" onClick={handleSave}>
                                {t('common.save')}
                            </button>
                            <button className="tetrone-btn tetrone-btn-cancel" onClick={() => setIsEditing(false)}>
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <RichText text={comment.content} className="tetrone-comment-text" />
                )}

                {currentUser && !isEditing && (
                    <div className="tetrone-comment-reply-wrapper">
                        <button className="tetrone-comment-reply-btn" onClick={() => onReply(comment.user)}>
                            <ReplyIcon /> {t('common.reply')}
                        </button>
                    </div>
                )}
            </div>

            {(isOwner || canReport) && !isEditing && (
                <div className="tetrone-comment-actions-container">
                    <button
                        className="tetrone-comment-action-btn-trigger"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <DotsIcon />
                    </button>

                    {showMenu && (
                        <div className="tetrone-actions-dropdown">
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
                                    <ReportIcon /> {t('reports.title')}
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