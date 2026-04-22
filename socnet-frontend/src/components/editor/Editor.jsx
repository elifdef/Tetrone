import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Mention from '@tiptap/extension-mention';

import { CustomStickerNode } from './CustomStickerNode';
import StickerPicker from './StickerPicker';
import stickerSuggestion from './StickerSuggestion';
import EditorMenu from './EditorMenu';
import { SpoilerMark, FontSize, EnterHandler, StickerTrigger } from './extensions';
import mentionSuggestion from './mentionSuggestion';

export default function Editor({
    value,
    onChange,
    placeholder = "",
    className = "",
    onEnter = null
}) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);
    const onEnterRef = useRef(onEnter);

    useEffect(() => {
        onEnterRef.current = onEnter;
    }, [onEnter]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            Placeholder.configure({ placeholder }),
            Underline,
            TextStyle,
            Color,
            FontSize,
            SpoilerMark,
            CustomStickerNode,
            EnterHandler.configure({ onEnterRef }),

            StickerTrigger.configure({
                suggestion: stickerSuggestion,
            }),

            Mention.configure({
                HTMLAttributes: { class: 'tetrone-user-mention' },
                suggestion: mentionSuggestion
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
    });

    useEffect(() => {
        if (editor && (value === '' || value === null || (typeof value === 'object' && Object.keys(value).length === 0)) && !editor.isDestroyed) {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showPicker && pickerRef.current && !pickerRef.current.contains(event.target)) {
                if (!event.target.closest('.tetrone-sticker-trigger-side')) {
                    setShowPicker(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    const handleStickerSelect = (sticker) => {
        if (editor) {
            editor.chain().focus().insertContent([
                {
                    type: 'customSticker',
                    attrs: {
                        id: sticker.id,
                        shortcode: sticker.shortcode,
                        src: sticker.url || sticker.src,
                        packName: sticker.pack_short_name || sticker.packName
                    }
                },
                { type: 'text', text: ' ' }
            ]).run();
            setShowPicker(false);
        }
    };

    if (!editor) return null;

    return (
        <div className="tetrone-editor-outer-container">
            <EditorMenu editor={editor} />

            <div className={`tetrone-editor-row-wrapper ${className}`}>
                <div className="tetrone-editor-input-area">
                    <EditorContent editor={editor} />
                </div>

                <button
                    type="button"
                    className="tetrone-sticker-trigger-side"
                    onClick={() => setShowPicker(!showPicker)}
                    title={t('editor.toolbar_stickers')}
                >
                    🙂
                </button>
            </div>

            {showPicker && (
                <div className="tetrone-sticker-picker-container" ref={pickerRef}>
                    <StickerPicker
                        onSelect={handleStickerSelect}
                        onClose={() => setShowPicker(false)}
                    />
                </div>
            )}
        </div>
    );
}