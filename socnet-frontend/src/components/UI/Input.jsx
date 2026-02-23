const Input = ({ label, className = "", ...props }) => (
    <>
        {label && (
            <label className="socnet-form-label" htmlFor={props.id}>
                {label}
            </label>
        )}
        <input
            className={`socnet-form-input ${className}`}
            {...props}
        />
    </>
);

export default Input;