import { useState } from 'react';

const Input = ({ label, className = "", type, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <>
            {label && (
                <label className="tetrone-form-label" htmlFor={props.id}>
                    {label}
                </label>
            )}

            {isPassword ? (
                <div className="tetrone-password-wrapper">
                    <input
                        type={inputType}
                        className={`tetrone-form-input ${className}`}
                        {...props}
                    />
                    <button
                        type="button"
                        className="tetrone-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Сховати пароль" : "Показати пароль"}
                    >
                        {showPassword ? (
                            /* Іконка: Закрите око */
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        )}
                    </button>
                </div>
            ) : (
                <input
                    type={inputType}
                    className={`tetrone-form-input ${className}`}
                    {...props}
                />
            )}
        </>
    );
};

export default Input;