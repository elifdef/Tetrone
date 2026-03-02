const Textarea = ({ label, className = "", ...props }) => {
    return (
        <>
            {label && (
                <label className="socnet-form-label" htmlFor={props.id}>
                    {label}
                </label>
            )}
            <textarea
                className={`socnet-form-textarea ${className}`}
                {...props}
            />
        </>
    );
};

export default Textarea;