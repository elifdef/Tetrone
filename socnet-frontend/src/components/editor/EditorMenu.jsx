import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';

export default function EditorMenu({ editor }) {
    if (!editor) return null;

    const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px', '22px', '24px'];

    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="tetrone-editor-bubble-menu">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            >
                <b>B</b>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            >
                <i>I</i>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
            >
                <u>U</u>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            >
                <s>S</s>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleSpoiler().run()}
                className={`tetrone-toolbar-btn ${editor.isActive('spoiler') ? 'is-active' : ''}`}
            >
                <span className="tetrone-spoiler-icon">Sp</span>
            </button>
            <input
                type="color"
                onInput={event => editor.chain().focus().setColor(event.target.value).run()}
                value={editor.getAttributes('textStyle').color || '#000000'}
                className="tetrone-toolbar-color"
            />
            <select
                onChange={event => editor.chain().focus().setFontSize(event.target.value).run()}
                value={editor.getAttributes('textStyle').fontSize || ''}
                className="tetrone-toolbar-select"
            >
                <option value="">Розмір</option>
                {ALLOWED_FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size.replace('px', '')}</option>
                ))}
            </select>
        </BubbleMenu>
    );
}