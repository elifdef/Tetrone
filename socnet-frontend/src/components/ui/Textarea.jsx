const Textarea = ({ label, className = "", ...props }) => {
    return (
        <>
            {label && (
                <label className="tetrone-form-label" htmlFor={props.id}>
                    {label}
                </label>
            )}
            <textarea
                className={`tetrone-form-textarea ${className}`}
                {...props}
            />
        </>
    );
};

export default Textarea;