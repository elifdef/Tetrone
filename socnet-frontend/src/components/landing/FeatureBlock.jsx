export default function FeatureBlock({ title, description, image, imageAlt, color }) {
    return (
        <div className="tetrone-feature-classic-item" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="tetrone-feature-classic-thumb" style={{ borderColor: color }}>
                <img src={image} alt={imageAlt} />
            </div>
            <div className="tetrone-feature-classic-content">
                <h2 className="tetrone-feature-classic-title" style={{ color: color }}>{title}</h2>
                <p className="tetrone-feature-classic-desc">{description}</p>
            </div>
        </div>
    );
}