const Button = ({ children, className = "", variant = "primary", ...props }) => {
    const btnClass = variant === 'save' ? 'tetrone-btn-save' : 'tetrone-btn';

    return (
        <button
            className={`${btnClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
export default Button;