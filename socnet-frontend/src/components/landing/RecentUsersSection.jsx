import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function RecentUsersSection({ users }) {
    const { t } = useTranslation();

    if (!users || users.length === 0) return null;

    return (
        <div className="tetrone-landing-recent-panel">
            <div className="tetrone-landing-recent-header">
                {t('main.landing_recent_users')}
            </div>
            
            <div className="tetrone-landing-recent-list">
                {users.map(user => (
                    <Link to={`/${user.username}`} key={user.id} className="tetrone-landing-recent-item">
                        <img 
                            src={user.avatar} 
                            alt={user.first_name} 
                            className="tetrone-landing-recent-avatar"
                        />
                        <span className="tetrone-landing-recent-name" title={`${user.first_name} ${user.last_name}`}>
                            {user.first_name} {user.last_name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}