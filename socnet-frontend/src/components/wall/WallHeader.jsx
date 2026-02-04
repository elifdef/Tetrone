export default function WallHeader({ postsCount, getDeclension }) {
    return (
        <div className="vk-wall-header">
            <span className="vk-wall-title">Стіна</span>
            <span className="vk-wall-count">
                {postsCount} {getDeclension(postsCount)}
            </span>
        </div>
    );
}