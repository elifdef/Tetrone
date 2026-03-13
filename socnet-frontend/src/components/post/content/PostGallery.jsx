export default function PostGallery({ images = [], onMediaClick }) {
    if (images.length === 0) return null;

    return (
        <div className={`socnet-post-gallery ${images.length === 1 ? 'count-1' : 'count-more'}`}>
            {images.map((media) => (
                <img
                    key={media.id}
                    src={media.url}
                    alt=""
                    className="socnet-gallery-image"
                    onClick={() => onMediaClick(media.id)}
                />
            ))}
        </div>
    );
}