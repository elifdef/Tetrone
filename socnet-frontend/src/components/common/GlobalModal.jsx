import { useEffect, useRef } from "react";
import Button from "../UI/Button";

export default function GlobalModal({
    isOpen, onClose, onResolve, type, message, placeholder, inputValue,
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
        <div className="socnet-modal-overlay" onClick={handleCancel}>
            {type === 'custom' ? (
                <div onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
            ) : (
                <div className="socnet-modal-dialog" onClick={(e) => e.stopPropagation()}>
                    <div className="socnet-modal-message">{message}</div>

                    {type === 'prompt' && (
                        <input
                            ref={inputRef} type="text" value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isSubmitDisabled && handleSubmit()}
                            className="socnet-form-input socnet-modal-input" placeholder={placeholder}
                        />
                    )}

                    {type === 'password' && (
                        <div className="socnet-password-wrapper">
                            <input
                                ref={inputRef} type="password" value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isSubmitDisabled && handleSubmit()}
                                className="socnet-form-input socnet-modal-input" placeholder={placeholder || '********'}
                            />
                        </div>
                    )}

                    <div className="socnet-modal-actions">
                        <Button className="socnet-btn-cancel" onClick={handleCancel}>{btnCancel}</Button>
                        <Button variant="save" onClick={handleSubmit} disabled={isSubmitDisabled}>{btnSubmit}</Button>
                    </div>
                </div>
            )}
        </div>
    );
}