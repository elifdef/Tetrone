import { useRef } from 'react';

const FileInput = ({
    onFileSelect,
    accept = "image/*",
    btnText,
    className = "",
    ...props
}) => {
    const inputRef = useRef(null);

    const handleClick = () => {
        inputRef.current.click();
    };

    return (
        <div className={`tetrone-file-input-wrapper ${className}`}>
            <input
                type="file"
                ref={inputRef}
                onChange={onFileSelect}
                accept={accept}
                className="tetrone-hidden-input"
                {...props}
            />

            <button
                type="button"
                className="tetrone-btn tetrone-btn-auto-width"
                onClick={handleClick}
            >
                {btnText}
            </button>
        </div>
    );
};

export default FileInput;