const Button = ({ children, className = "", variant = "primary", ...props }) => {
    const btnClass = variant === 'save' ? 'vk-btn-save' : 'vk-btn';
    
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