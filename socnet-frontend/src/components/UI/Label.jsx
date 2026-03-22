const Label = ({ children, className = "", ...props }) => {
    return (
        <label className={`tetrone-form-label ${className}`} {...props}>
            {children}
        </label>
    );
};
export default Label;