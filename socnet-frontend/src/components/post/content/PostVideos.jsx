import VideoPlayer from "../../UI/VideoPlayer";

export default function PostVideos({ localVideos = [], youtubeVideos = [] }) {
    const visibleYouTube = youtubeVideos.filter(yt => !yt.isRemoved);

    if (localVideos.length === 0 && visibleYouTube.length === 0) return null;

    return (
        <div className="tetrone-post-videos-container">
            {localVideos.map((video) => (
                <div key={`loc-${video.id}`} className="tetrone-feed-video-wrapper">
                    <VideoPlayer src={video.url} />
                </div>
            ))}

            {visibleYouTube.map((yt) => (
                <div key={yt.id} className="tetrone-feed-video-wrapper">
                    <VideoPlayer src={yt.videoId} provider="youtube" />
                </div>
            ))}
        </div>
    );
}