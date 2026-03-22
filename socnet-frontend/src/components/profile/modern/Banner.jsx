export default function Banner({ personalization }) {
    const bannerStyle = personalization?.banner_image
        ? { background: `url(${personalization.banner_image}) center/cover no-repeat` }
        : { background: personalization?.banner_color || '#cccccc' };

    return (
        <div
            className="tetrone-modern-banner"
            style={bannerStyle}
        />
    );
}