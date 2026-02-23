const FeatureBlock = ({ title, description, image, imageAlt, isReversed, color }) => (
    <div className={`socnet-feature-block ${isReversed ? 'reversed' : ''}`}>
        <div className="socnet-feature-text">
            <h2 style={{color: color}}>{title}</h2>
            <p>{description}</p>
        </div>
        <div className="socnet-feature-visual" style={{ borderLeft: `3px solid ${color}` }}>
            <img src={image} alt={imageAlt} />
        </div>
    </div>
);

export default FeatureBlock;