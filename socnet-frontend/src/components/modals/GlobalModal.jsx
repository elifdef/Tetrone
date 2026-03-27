import { useEffect, useRef } from "react";
import Button from "../ui/Button";

export default function GlobalModal({
    isOpen, onClose, onResolve, type, title, message, placeholder, inputValue,
    setInputValue, btnSubmit, btnCancel, allowEmptyPrompt, children
}) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            if (type === 'prompt' || type === 'password') setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen, type]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onResolve(type === 'confirm' ? false : null);
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onResolve, type]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (type === 'confirm') onResolve(true);
        else onResolve(inputValue);
        onClose();
    };

    const handleCancel = () => {
        onResolve(type === 'confirm' ? false : null);
        onClose();
    };

    const isSubmitDisabled = (type === 'prompt' || type === 'password') && !allowEmptyPrompt && !inputValue.trim();

    return (
        <div className="tetrone-modal-overlay" onClick={handleCancel}>
            {type === 'custom' ? (
                <div onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
            ) : (
                <div className="tetrone-modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="tetrone-modal-header">
                        <h3>{title}</h3>
                        <button className="tetrone-modal-close" onClick={handleCancel}>✖</button>
                    </div>

                    <div className="tetrone-modal-body">
                        <div className="tetrone-modal-message">{message}</div>

                        {type === 'prompt' && (
                            <input
                                ref={inputRef} type="text" value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isSubmitDisabled && handleSubmit()}
                                className="tetrone-form-input tetrone-modal-input" placeholder={placeholder}
                            />
                        )}

                        {type === 'password' && (
                            <div className="tetrone-password-wrapper">
                                <input
                                    ref={inputRef} type="password" value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isSubmitDisabled && handleSubmit()}
                                    className="tetrone-form-input tetrone-modal-input" placeholder={placeholder || '********'}
                                />
                            </div>
                        )}
                    </div>

                    <div className="tetrone-modal-footer">
                        <Button className="tetrone-btn-ghost" onClick={handleCancel}>{btnCancel}</Button>
                        <Button variant="save" onClick={handleSubmit} disabled={isSubmitDisabled}>{btnSubmit}</Button>
                    </div>
                </div>
            )}
        </div>
    );
}