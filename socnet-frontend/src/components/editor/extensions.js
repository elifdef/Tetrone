import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const SpoilerMark = Mark.create({
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

const ALLOWED_FONT_SIZES = ['11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px', '22px', '24px'];

export const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() { return { types: ['textStyle'] }; },
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
                if (!ALLOWED_FONT_SIZES.includes(fontSize) && fontSize !== null) return false;
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
        };
    },
});

export const EnterHandler = Extension.create({
    name: 'enterHandler',
    addOptions() { return { onEnterRef: null }; },
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

export const StickerTrigger = Extension.create({
    name: 'stickerTrigger',
    addOptions() {
        return { suggestion: {} };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});