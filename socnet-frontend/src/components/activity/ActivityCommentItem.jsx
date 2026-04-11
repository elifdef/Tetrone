import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { DeleteIcon } from "../ui/Icons";
import RichText from '../common/RichText';

export default function ActivityCommentItem({ comment, onDelete }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const postAuthor = comment.post?.user;
    const me = comment.user;
    const opColor = postAuthor?.personalization?.username_color;

    const renderContent = () => {
        if (!comment.content) return null;

        if (typeof comment.content === 'object') {
            return <RichText text={comment.content} />;
        }

        return comment.content;
    };

    return (
        <div className="tetrone-activity-card tetrone-relative-card">
            {onDelete && (
                <div className="tetrone-absolute-actions">
                    <button
                        className="tetrone-action-icon"
                        onClick={onDelete}
                        title={t('action.delete')}
                    >
                        <DeleteIcon width={16} height={16} />
                    </button>
                </div>
            )}

            {postAuthor && (
                <div className="tetrone-activity-op">
                    <Link to={`/${postAuthor.username}`}>
                        <img
                            src={postAuthor.avatar}
                            alt={postAuthor.username}
                            className="tetrone-activity-op-avatar"
                            style={opColor ? { color: opColor } : undefined}
                        />
                    </Link>
                    <span>
                        {t('activity.comments.you_commented_on')}{' '}
                        <Link to={`/post/${comment.post_id}`} className="tetrone-link">
                            {t('common.post')}
                        </Link>{' '}
                        {t('activity.comments.of_user')}{' '}
                        <Link to={`/${postAuthor.username}`} className="tetrone-link tetrone-activity-op-name">
                            {postAuthor.first_name} {postAuthor.last_name}
                        </Link>
                    </span>
                </div>
            )}

            <div className="tetrone-activity-reply">
                {me && (
                    <img
                        src={me.avatar}
                        alt="my avatar"
                        className="tetrone-activity-reply-avatar"
                    />
                )}

                <div className="tetrone-activity-bubble-wrapper">
                    <div className="tetrone-activity-bubble">
                        {renderContent()}
                    </div>

                    <div className="tetrone-activity-meta">
                        <span className="tetrone-notification-date tetrone-activity-date">
                            {formatDate(comment.created_at)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}