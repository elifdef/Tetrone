import { Link } from "react-router-dom";
import SendIcon from "../../assets/sendComment.svg?react";

export default function CommentForm({ user, text, setText, onSubmit }) {
    return (
        <form className="vk-comment-form" onSubmit={onSubmit}>
            {user && (
                <>
                    <Link to={`/${user.username}`}>
                        <img
                            src={user.avatar || "/defaultAvatar.jpg"}
                            alt="Me"
                            className="vk-comment-avatar"
                        />
                    </Link>

                    <div className="vk-comment-input-wrapper">
                        <input
                            type="text"
                            className="vk-comment-input"
                            placeholder="Написати коментар..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />

                        <button type="submit" className="vk-send-btn" disabled={!text.trim()}>
                            <SendIcon width={16} height={16} />
                        </button>
                    </div>
                </>
            )}
        </form>
    );
}