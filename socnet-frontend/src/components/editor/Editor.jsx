import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CustomStickerNode } from './CustomStickerNode';
import StickerPicker from './StickerPicker';

export default function Editor({
    value,
    onChange,
    placeholder = "",
    className = ""
}) {
    const [showPicker, setShowPicker] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false }),
            Placeholder.configure({ placeholder }),
            CustomStickerNode,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
    });

    useEffect(() => {
        if (editor && (value === '' || value === null) && !editor.isDestroyed) {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    const handleStickerSelect = (sticker) => {
        if (editor) {
            editor.chain().focus().insertContent({
                type: 'customSticker',
                attrs: {
                    id: sticker.id,
                    shortcode: sticker.shortcode,
                    src: sticker.url
                }
            }).run();
        }
        setShowPicker(false);
    };

    if (!editor) return null;

    return (
        <div className="tetrone-editor-outer-container">
            <div className={`tetrone-editor-row-wrapper ${className}`}>
                <div className="tetrone-editor-input-area">
                    <EditorContent editor={editor} />
                </div>

                <button
                    type="button"
                    className="tetrone-sticker-trigger-side"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    🙂
                </button>
            </div>

            {showPicker && (
                <div className="tetrone-sticker-picker-container">
                    <StickerPicker
                        onSelect={handleStickerSelect}
                        onClose={() => setShowPicker(false)}
                    />
                </div>
            )}
        </div>
    );
}