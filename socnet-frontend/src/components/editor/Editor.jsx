import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { CustomStickerNode } from './CustomStickerNode';
import StickerPicker from './StickerPicker';

const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() {
        return [{ tag: 'span[data-spoiler]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'tetrone-spoiler' }), 0];
    },
    addCommands() {
        return {
            toggleSpoiler: () => ({ commands }) => commands.toggleMark(this.name)
        };
    },
    addKeyboardShortcuts() {
        return {
            'Mod-Shift-s': () => this.editor.commands.toggleSpoiler()
        };
    }
});

const ALLOWED_FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px'];

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return { types: ['textStyle'] };
    },
    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                fontSize: {
                    default: null,
                    parseHTML: element => {
                        const size = element.style.fontSize?.replace(/['"]+/g, '');
                        return ALLOWED_FONT_SIZES.includes(size) ? size : null;
                    },
                    renderHTML: attributes => {
                        if (!attributes.fontSize || !ALLOWED_FONT_SIZES.includes(attributes.fontSize)) {
                            return {};
                        }
                        return { style: `font-size: ${attributes.fontSize}` };
                    },
                },
            },
        }];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                if (!ALLOWED_FONT_SIZES.includes(fontSize) && fontSize !== null) {
                    return false;
                }
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
        };
    },
});

const EnterHandler = Extension.create({
    name: 'enterHandler',
    addOptions() {
        return { onEnterRef: null };
    },
    addKeyboardShortcuts() {
        return {
            'Enter': () => {
                const onEnter = this.options.onEnterRef?.current;
                if (onEnter) {
                    onEnter();
                    return true;
                }
                return false;
            },
            'Shift-Enter': () => this.editor.commands.first(({ commands }) => [
                () => commands.newlineInCode(),
                () => commands.createParagraphNear(),
                () => commands.liftEmptyBlock(),
                () => commands.splitBlock(),
            ]),
        };
    }
});

const MenuBar = ({ editor, t }) => {
    if (!editor) return null;

    return (
        <div className="tetrone-editor-toolbar">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                title={t('editor.toolbar_bold')}
            >
                <b>B</b>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                title={t('editor.toolbar_italic')}
            >
                <i>I</i>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                title={t('editor.toolbar_underline')}
            >
                <u>U</u>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                title={t('editor.toolbar_strike')}
            >
                <s>S</s>
            </button>

            {/* Спойлер */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleSpoiler().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('spoiler') ? 'is-active' : ''}`}
                title={t('editor.toolbar_spoiler')}
            >
                <span className="tetrone-spoiler-icon">Sp</span>
            </button>

            {/* Вибір кольору */}
            <input
                type="color"
                onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="tetrone-toolbar-color"
                title={t('editor.toolbar_color')}
            />

            <select
                onChange={event => editor.chain().focus().setFontSize(event.target.value).run()}
                value={editor.getAttributes('textStyle').fontSize || ''}
                className="tetrone-toolbar-select"
                title={t('editor.toolbar_size')}
            >
                <option value="12px">12</option>
                <option value="14px">14</option>
                <option value="16px">16</option>
                <option value="18px">18</option>
                <option value="20px">20</option>
                <option value="24px">24</option>
            </select>
        </div>
    );
};

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
            EnterHandler.configure({ onEnterRef })
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

    // закриття пікера стікерів при кліку поза ним
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

    // вставка стікера в текст
    const handleStickerSelect = (sticker) => {
        if (editor) {
            editor.chain().focus().insertContent({
                type: 'customSticker',
                attrs: {
                    id: sticker.id,
                    shortcode: sticker.shortcode,
                    src: sticker.url,
                    packName: sticker.pack_short_name
                }
            }).run();
        }
    };

    if (!editor) return null;

    return (
        <div className="tetrone-editor-outer-container">
            <MenuBar editor={editor} t={t} />

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