const Textarea = ({ label, className = "", ...props }) => {
    return (
        <div style={{ marginBottom: '10px' }}>
            {label && (
                <label className="socnet-form-label" htmlFor={props.id}>
                    {label}
                </label>
            )}
            <textarea
                className={`socnet-form-textarea ${className}`}
                {...props}
            />
        </div>
    );
};

export default Textarea;