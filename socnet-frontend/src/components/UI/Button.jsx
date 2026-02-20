const Button = ({ children, className = "", variant = "primary", ...props }) => {
    const btnClass = variant === 'save' ? 'socnet-btn-save' : 'socnet-btn';

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