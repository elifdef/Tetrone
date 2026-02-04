export default function ProfileInfo({ user, displayBirth, displayCountry, showFriendsBlock }) {
    return (
        <>
            <div className="vk-info-block">
                <h4 className="vk-section-title">Інформація</h4>
                <div className="vk-info-row">
                    <div className="vk-label">День народження:</div>
                    <div className="vk-value">{displayBirth}</div>
                </div>
                <div className="vk-info-row">
                    <div className="vk-label">Країна проживання</div>
                    <div className="vk-value">{displayCountry}</div>
                </div>
                <div className="vk-info-row">
                    <div className="vk-label">Зареєстровано:</div>
                    <div className="vk-value">{user.created_at}</div>
                </div>
            </div>

            {showFriendsBlock && (
                <div className="vk-info-block">
                    <h4 className="vk-section-title">Друзі</h4>
                    <div className="vk-info-row">
                        <div className="vk-label">Друзі</div>
                        <div className="vk-value">{user.friends_count || 0}</div>
                    </div>
                    <div className="vk-info-row">
                        <div className="vk-label">Підписники</div>
                        <div className="vk-value">{user.followers_count || 0}</div>
                    </div>
                </div>
            )}
        </>
    );
}