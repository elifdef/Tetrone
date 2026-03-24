import { useState, useRef } from "react";
import SendIcon from "../../assets/sendComment.svg?react";
import { ReplyIcon, DeleteIcon } from "../ui/Icons";
import Editor from '../editor/Editor';
import { isEditorEmpty } from "../../utils/editorHelpers";

export default function CommentForm({ user, onSubmit, placeholder, replyToUser, onClearReply }) {
    const [content, setContent] = useState('');
    const inputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditorEmpty(content)) return;

        let finalContent = typeof content === 'object' ? JSON.parse(JSON.stringify(content)) : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] };

        if (replyToUser && finalContent.content && finalContent.content.length > 0) {
            const firstParagraph = finalContent.content[0];
            if (!firstParagraph.content) firstParagraph.content = [];
            
            firstParagraph.content.unshift(
                { type: 'text', text: ', ' },
                { type: 'mention', attrs: { id: replyToUser.id, username: replyToUser.username } }
            );
        }

        const success = await onSubmit(finalContent);
        if (success) {
            setContent('');
            if (onClearReply) onClearReply();
        }
    };

    return (
        <form className="tetrone-comment-form" onSubmit={handleSubmit}>
            {user && (
                <>
                    <img src={user.avatar} alt={user.username} className="tetrone-comment-avatar" />

                    <div className="tetrone-comment-input-wrapper">
                        {replyToUser && (
                            <div className="tetrone-comment-reply-preview">
                                <div className="tetrone-reply-preview-left">
                                    <ReplyIcon width={12} height={12} />
                                    <span className="tetrone-reply-preview-name">
                                        {replyToUser.first_name} {replyToUser.last_name}
                                    </span>
                                </div>
                                <button type="button" onClick={onClearReply} className="tetrone-reply-preview-close">
                                    <DeleteIcon width={12} height={12} />
                                </button>
                            </div>
                        )}

                        <div className="tetrone-comment-input-row">
                            <Editor
                                className="tetrone-comment-textarea"
                                placeholder={placeholder}
                                value={content}
                                onChange={setContent}
                            />
                            
                            <button type="submit" className="tetrone-send-btn" disabled={isEditorEmpty(content)}>
                                <SendIcon width={16} height={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </form>
    );
}