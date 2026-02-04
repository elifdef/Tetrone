export default function ProfileStatus({ bio }) {
    return (
        <div className="vk-status-box">
            {bio || <span style={{ color: '#999' }}>Статус не встановлено</span>}
        </div>
    );
}