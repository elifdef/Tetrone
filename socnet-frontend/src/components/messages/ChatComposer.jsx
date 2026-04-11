import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Editor from '../editor/Editor';
import Button from '../ui/Button';
import { extractPreviewText } from '../../utils/messageParser';
import {
    EditIcon, ReplyIcon, ImageIcon, VideoIcon, AudioIcon,
    DocumentIcon as FileIcon, CloseIcon, SendIcon, AttachIcon
} from '../ui/Icons';

const ImagePreview = ({ file, onRemove, theme }) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [file]);

    return (
        <div className={theme === 'modern' ? "tetrone-modern-preview-item" : "tetrone-selected-file-item"}>
            {theme === 'modern' ? (
                <>
                    {url ? <img src={url} alt="preview" className="tetrone-modern-preview-img" /> : <div className="tetrone-modern-file-icon"><FileIcon width={16} height={16} /></div>}
                    <button className="tetrone-modern-remove-preview" onClick={onRemove}><CloseIcon width={12} height={12} /></button>
                </>
            ) : (
                <>
                    {file.name}
                    <button className="tetrone-btn-old-icon" onClick={onRemove}><CloseIcon width={12} height={12} /></button>
                </>
            )}
        </div>
    );
};

export default function ChatComposer({
    theme, text, setText, files, editingMessage, replyingTo, replyingToName,
    handleCancelReplyEdit, handleRemoveFile, handleFileChange, handleSend, onTyping,
    myAvatar, targetAvatar
}) {
    const { t } = useTranslation();
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const attachMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) setIsAttachOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isEditorEmpty = !text || (typeof text === 'object' && text.content?.length === 1 && !text.content[0].content) || (typeof text === 'string' && !text.trim());
    const isSendDisabled = isEditorEmpty && files.length === 0;

    const handleFileSelect = (e) => {
        handleFileChange(e);
        setIsAttachOpen(false);
    };

    const renderReplyBar = () => {
        if (!editingMessage && !replyingTo) return null;
        const previewContent = editingMessage ? extractPreviewText(editingMessage.text, t) : extractPreviewText(replyingTo.text, t);

        if (theme === 'modern') {
            return (
                <div className="tetrone-modern-reply-bar">
                    <div className="tetrone-modern-reply-icon">{editingMessage ? <EditIcon /> : <ReplyIcon />}</div>
                    <div className="tetrone-modern-reply-content">
                        <span className="tetrone-modern-reply-title">{editingMessage ? t('messages.editing') : replyingToName}</span>
                        <span className="tetrone-modern-reply-text">{previewContent}</span>
                    </div>
                    <button className="tetrone-modern-reply-close" onClick={handleCancelReplyEdit}><CloseIcon /></button>
                </div>
            );
        }
        return (
            <div className="tetrone-messages-old-editing tetrone-message-reply-quote">
                <div className="reply-quote-content">
                    <div className="reply-author">{editingMessage ? t('messages.editing') : replyingToName}</div>
                    <div className="reply-text">{previewContent}</div>
                </div>
                <button className="tetrone-btn-old-icon" onClick={handleCancelReplyEdit}><CloseIcon /></button>
            </div>
        );
    };

    return (
        <div className={theme === 'modern' ? "tetrone-modern-composer" : "tetrone-messages-old-composer-wrapper"}>
            {renderReplyBar()}

            {files.length > 0 && (
                <div className={theme === 'modern' ? "tetrone-modern-previews-container" : "tetrone-selected-files"}>
                    {files.map((f, idx) => <ImagePreview key={idx} file={f} onRemove={() => handleRemoveFile(idx)} theme={theme} />)}
                </div>
            )}

            <div className={theme === 'modern' ? "tetrone-modern-input-capsule" : "tetrone-messages-old-composer-inner"}>

                {theme === 'old' && <img src={myAvatar} alt="avatar" className="tetrone-messages-old-avatar composer-avatar" />}

                {theme === 'modern' && (
                    <div className="tetrone-modern-attach-wrapper" ref={attachMenuRef}>
                        <button className="tetrone-modern-attach-btn" onClick={() => setIsAttachOpen(!isAttachOpen)}><AttachIcon /></button>
                        {isAttachOpen && (
                            <div className="tetrone-modern-attach-dropdown">
                                <label className="tetrone-modern-attach-dropdown-item">
                                    <ImageIcon width={16} height={16} /> <span>{t('action.attach_image')}</span>
                                    <input type="file" accept="image/*" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                </label>
                                <label className="tetrone-modern-attach-dropdown-item">
                                    <VideoIcon width={16} height={16} /> <span>{t('action.attach_video')}</span>
                                    <input type="file" accept="video/*" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                </label>
                                <label className="tetrone-modern-attach-dropdown-item">
                                    <AudioIcon width={16} height={16} /> <span>{t('action.attach_audio')}</span>
                                    <input type="file" accept="audio/*" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                </label>
                                <label className="tetrone-modern-attach-dropdown-item">
                                    <FileIcon width={16} height={16} /> <span>{t('action.attach_document')}</span>
                                    <input type="file" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                </label>
                            </div>
                        )}
                    </div>
                )}

                <div className={theme === 'modern' ? "tetrone-modern-composer-center" : "tetrone-messages-old-composer-center"}>
                    <Editor
                        className={theme === 'modern' ? "tetrone-modern-textarea" : "tetrone-messages-old-textarea"}
                        value={text}
                        onChange={(val) => { setText(val); if (onTyping) onTyping(); }}
                        placeholder={t('action.type_message')}
                        onEnter={handleSend}
                    />

                    {theme === 'old' && (
                        <div className="tetrone-messages-old-composer-actions">
                            <Button className="tetrone-messages-old-send-btn" onClick={handleSend} disabled={isSendDisabled}>
                                {editingMessage ? t('action.save') : t('action.send')}
                            </Button>
                            <div className="tetrone-attach-wrapper" ref={attachMenuRef}>
                                <span className="tetrone-messages-old-attach-label" onClick={() => setIsAttachOpen(!isAttachOpen)}>{t('action.attach')}</span>
                                {isAttachOpen && (
                                    <div className="tetrone-attach-dropdown">
                                        <label className="tetrone-attach-dropdown-item">
                                            <ImageIcon width={16} height={16} /> <span>{t('action.attach_image')}</span>
                                            <input type="file" accept="image/*" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                        </label>
                                        <label className="tetrone-attach-dropdown-item">
                                            <VideoIcon width={16} height={16} /> <span>{t('action.attach_video')}</span>
                                            <input type="file" accept="video/*" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                        </label>
                                        <label className="tetrone-attach-dropdown-item">
                                            <AudioIcon width={16} height={16} /> <span>{t('action.attach_audio')}</span>
                                            <input type="file" accept="audio/*" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                        </label>
                                        <label className="tetrone-attach-dropdown-item">
                                            <FileIcon width={16} height={16} /> <span>{t('action.attach_document')}</span>
                                            <input type="file" multiple className="tetrone-hidden-input" onChange={handleFileSelect} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {theme === 'modern' && (
                    <button className={`tetrone-modern-send-btn ${!isSendDisabled ? 'active' : ''}`} onClick={handleSend} disabled={isSendDisabled}>
                        <SendIcon />
                    </button>
                )}

                {theme === 'old' && <img src={targetAvatar} alt="avatar" className="tetrone-messages-old-avatar composer-avatar" />}

            </div>
        </div>
    );
}