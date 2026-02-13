const Label = ({ children, className = "", ...props }) => {
    return (
        <label className={`vk-form-label ${className}`} {...props}>
            {children}
        </label>
    );
};
export default Label;