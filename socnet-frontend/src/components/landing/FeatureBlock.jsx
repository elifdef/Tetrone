const FeatureBlock = ({ title, description, image, imageAlt, isReversed, color }) => (
    <div className={`tetrone-feature-block ${isReversed ? 'reversed' : ''}`}>
        <div className="tetrone-feature-text">
            <h2 style={{color: color}}>{title}</h2>
            <p>{description}</p>
        </div>
        <div className="tetrone-feature-visual" style={{ borderLeft: `3px solid ${color}` }}>
            <img src={image} alt={imageAlt} />
        </div>
    </div>
);

export default FeatureBlock;