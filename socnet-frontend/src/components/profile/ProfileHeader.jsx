export default function ProfileHeader({ user }) {
    return (
        <div className="vk-name-row">
            <h2 className="vk-name">
                {user.first_name} {user.last_name}
                <span className="vk-nick"> @{user.username}</span>
            </h2>
            <span className="vk-nick" style={{ float: 'right', color: '#8c8c8c' }}>
                {user.is_online ? "Online" : "Offline"}
            </span>
        </div>
    );
}