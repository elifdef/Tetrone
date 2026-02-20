const Input = ({ label, className = "", ...props }) => (
    <div>
        {label && (
            <label className="socnet-form-label" htmlFor={props.id}>
                {label}
            </label>
        )}
        <input 
            className={`socnet-form-input ${className}`} 
            {...props} 
        />
    </div>
);

export default Input;