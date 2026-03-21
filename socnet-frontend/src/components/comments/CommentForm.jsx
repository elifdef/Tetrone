import { useState, useRef, useEffect } from "react";
import SendIcon from "../../assets/sendComment.svg?react";
import { ReplyIcon, DeleteIcon } from "./CommentIcons";

export default function CommentForm({ user, onSubmit, placeholder, replyToUser, onClearReply }) {
    const [text, setText] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (replyToUser) {
            inputRef.current?.focus();
        }
    }, [replyToUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        const finalContent = replyToUser ? `@${replyToUser.username}, ${text}` : text;

        const success = await onSubmit(finalContent);
        if (success) {
            setText("");
            if (onClearReply) onClearReply();
        }
    };

    return (
        <form className="socnet-comment-form" onSubmit={handleSubmit}>
            {user && (
                <>
                    <img src={user.avatar} alt={user.username} className="socnet-comment-avatar" />

                    <div className="socnet-comment-input-wrapper">
                        {replyToUser && (
                            <div className="socnet-comment-reply-preview">
                                <div className="socnet-reply-preview-left">
                                    <ReplyIcon width={12} height={12} />
                                    <span className="socnet-reply-preview-name">
                                        {replyToUser.first_name} {replyToUser.last_name}
                                    </span>
                                </div>
                                <button type="button" onClick={onClearReply} className="socnet-reply-preview-close">
                                    <DeleteIcon width={12} height={12} />
                                </button>
                            </div>
                        )}

                        <div className="socnet-comment-input-row">
                            <textarea
                                ref={inputRef}
                                className="socnet-comment-textarea"
                                placeholder={placeholder}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={1}
                            />
                            <button type="submit" className="socnet-send-btn" disabled={!text.trim()}>
                                <SendIcon width={16} height={16} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </form>
    );
}