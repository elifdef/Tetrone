import { Node, mergeAttributes } from '@tiptap/core';

export const CustomStickerNode = Node.create({
    name: 'customSticker',
    group: 'inline',
    inline: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            shortcode: { default: null },
            src: { default: null },
            packName: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'img.tetrone-micro-sticker' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes, {
            class: 'tetrone-micro-sticker',
            src: HTMLAttributes.src,
            alt: `:${HTMLAttributes.shortcode}:`,
            // 'data-shortcode': HTMLAttributes.shortcode,
            'data-pack-name': HTMLAttributes.packName
        })];
    },
});