import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const FileInput = ({
    onFileSelect,
    accept = "image/*",
    btnText,
    className = "",
    ...props
}) => {
    const { t } = useTranslation();
    const inputRef = useRef(null);

    const handleClick = () => {
        inputRef.current.click();
    };

    return (
        <div className={className} style={{ display: 'inline-block' }}>
            <input
                type="file"
                ref={inputRef}
                onChange={onFileSelect}
                accept={accept}
                style={{ display: 'none' }}
                {...props}
            />

            <button
                type="button"
                className="socnet-btn"
                onClick={handleClick}
                style={{ width: 'auto' }}
            >
                {btnText || t('common.upload')}
            </button>
        </div>
    );
};

export default FileInput;