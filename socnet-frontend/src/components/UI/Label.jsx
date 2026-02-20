const Label = ({ children, className = "", ...props }) => {
    return (
        <label className={`socnet-form-label ${className}`} {...props}>
            {children}
        </label>
    );
};
export default Label;