import { Node, mergeAttributes } from '@tiptap/core';

export const CustomStickerNode = Node.create({
    name: 'customSticker',
    group: 'inline',
    inline: true,
    selectable: true, // Дозволяє виділити емодзі мишкою і видалити
    draggable: false,

    addAttributes() {
        return {
            id: { default: null },
            shortcode: { default: null },
            src: { default: null },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'img.tetrone-micro-sticker',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(HTMLAttributes, {
            class: 'tetrone-micro-sticker',
            alt: `:${HTMLAttributes.shortcode}:`,
            'data-sticker-id': HTMLAttributes.id
        })];
    },
});