import VideoPlayer from "../../UI/VideoPlayer";

export default function YouTubePreviews({ youtubeLinks, removedPreviews, onToggle }) {
    if (!youtubeLinks || youtubeLinks.length === 0) return null;

    return (
        <div className="socnet-post-videos-container">
            {youtubeLinks.map(yt => {
                const isAttached = !removedPreviews.includes(yt.videoId);

                return (
                    <div key={`preview-${yt.id}`} className="socnet-preview-youtube-wrapper">
                        <label
                            className="socnet-youtube-checkbox-overlay"
                        >
                            <input
                                type="checkbox"
                                checked={isAttached}
                                onChange={() => onToggle(yt.videoId)}
                            />
                        </label>

                        <div style={{
                            opacity: isAttached ? 1 : 0.4,
                            pointerEvents: isAttached ? 'auto' : 'none',
                            transition: 'opacity 0.2s ease',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <VideoPlayer src={yt.videoId} provider="youtube" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}