import { useEffect, useState } from "react";

export default function ActionModal({
    isOpen,
    onClose,
    type,
    placeholder,
    message,
    defaultText = '',
    btnSubmit,
    btnCancel,
    onResolve,
    emptyInput,
}) {
    const [inputValue, setInputValue] = useState(defaultText);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onResolve(type === 'prompt' ? null : false);
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onResolve, type]);

    useEffect(() => {
        if (isOpen) setInputValue(defaultText);
    }, [isOpen, defaultText]);

    if (!isOpen) return null;

    return (
        <div className="socnet-modal-overlay" onClick={() => {
            onResolve(type === 'prompt' ? null : false);
            onClose();
        }}>
            <div
                className="socnet-modal-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="socnet-modal-message">
                    {message}
                </div>

                {type === 'prompt' && (
                    <input
                        autoFocus
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="socnet-form-input socnet-modal-input"
                        placeholder={placeholder}
                    />
                )}

                <div className="socnet-modal-actions">
                    <button
                        className="socnet-btn socnet-modal-btn"
                        onClick={() => {
                            onResolve(type === 'prompt' ? inputValue : true);
                            onClose();
                        }}
                        disabled={(type === 'prompt' && !inputValue.trim()) && emptyInput}
                    >
                        {btnSubmit}
                    </button>

                    <button
                        className="socnet-btn socnet-btn-ghost socnet-modal-btn"
                        onClick={() => {
                            onResolve(type === 'prompt' ? null : false);
                            onClose();
                        }}
                    >
                        {btnCancel}
                    </button>
                </div>
            </div>
        </div>
    );
}