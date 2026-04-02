import "./Button.css";
const Button = ({ children, className = "", variant = "primary", disabled = false, ...props }) => {
    const variantClasses = {
        primary: 'tetrone-btn-primary',     // Головна дія (зберегти, надіслати)         
        secondary: 'tetrone-btn-secondary', // Другорядна (скасувати, назад)         
        danger: 'tetrone-btn-danger',       // Видалення (червона)         
        warning: 'tetrone-btn-warning',     // Увага (жовта)     
    };
    
    const currentVariantClass = variantClasses[variant] || variantClasses.primary;

    const classes = ['tetrone-btn', currentVariantClass, disabled ? 'is-disabled' : '', className].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};
export default Button;