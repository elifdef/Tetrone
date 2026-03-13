import VideoPlayer from "../../UI/VideoPlayer";

export default function PostVideos({ localVideos = [], youtubeVideos = [], onMediaClick }) {
    const visibleYouTube = youtubeVideos.filter(yt => !yt.isRemoved);

    if (localVideos.length === 0 && visibleYouTube.length === 0) return null;

    return (
        <div className="socnet-post-videos-container">
            {localVideos.map((video) => (
                <div key={`loc-${video.id}`} className="socnet-feed-video-wrapper">
                    <VideoPlayer src={video.url} />
                    <div className="socnet-feed-video-overlay" onClick={() => onMediaClick(video.id)}></div>
                </div>
            ))}

            {visibleYouTube.map((yt) => (
                <div key={yt.id} className="socnet-feed-video-wrapper">
                    <VideoPlayer src={yt.videoId} provider="youtube" />
                    <div className="socnet-feed-video-overlay" onClick={() => onMediaClick(yt.videoId)}></div>
                </div>
            ))}
        </div>
    );
}