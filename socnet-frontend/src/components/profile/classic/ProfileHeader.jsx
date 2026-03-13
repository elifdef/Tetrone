import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../../hooks/useDateFormatter';

export default function ProfileHeader({ user, isPreview }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const getStatusText = () => {
        if (user.is_online) return t('profile.online');
        if (!user.last_seen) return t('profile.offline', { time: '' });

        const dateStr = formatDate(user.last_seen);
        if (user.gender === 1) return t('profile.status.last_seen_m', { time: dateStr });
        if (user.gender === 2) return t('profile.status.last_seen_f', { time: dateStr });
    };

    const getStatusBlock = () => {
        if (isPreview) return;
        return (
            <span className={`socnet-status ${user.is_online ? 'online' : 'offline'}`}>
                {getStatusText()}
            </span>
        )
    }

    const customNameColor = user.personalization?.username_color;
    const nameStyle = customNameColor && customNameColor.startsWith('#') 
        ? { color: customNameColor } 
        : {};

    return (
        <div className="socnet-name-row">
            <h2 className="socnet-name" style={nameStyle}>
                {user.first_name} {user.last_name}
                <span className="socnet-nick" style={nameStyle}> @{user.username}</span>
            </h2>
            {getStatusBlock()}
        </div>
    );
}