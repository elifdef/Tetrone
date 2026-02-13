import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const FileInput = ({ onFileSelect, accept = "image/*", btnText }) => {
    const { t } = useTranslation();
    const inputRef = useRef(null);

    const handleClick = () => {
        inputRef.current.click();
    };

    return (
        <>
            <input
                type="file"
                ref={inputRef}
                onChange={onFileSelect}
                accept={accept}
                style={{ display: 'none' }}
            />

            <button 
                type="button" 
                className="vk-btn" 
                onClick={handleClick}
                style={{ width: 'auto', display: 'inline-block' }}
            >
                {btnText || t('common.upload')}
            </button>
        </>
    );
};

export default FileInput;