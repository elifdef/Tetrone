export default function ProfileAvatar({ user, isPreview, isBlocked }) {
    return (
        <div className="socnet-photo-box">
            <img
                src={user.avatar}
                alt={user.username}
                className="socnet-avatar"
                style={!isPreview && isBlocked ? { opacity: 0.6, filter: 'grayscale(100%)' } : {}}
            />
        </div>
    );
}