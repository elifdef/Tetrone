import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import SuggestionList from './SuggestionList';
import StickerService from '../../services/sticker.service';

let cachedStickers = null;

export default {
    char: ':',

    command: ({ editor, range, props }) => {
        editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
                type: 'customSticker',
                attrs: {
                    id: props.id,
                    shortcode: props.shortcode,
                    src: props.url,
                    packName: props.pack_short_name
                }
            })
            .insertContent(' ')
            .run();
    },

    async items({ query }) {
        if (query.length < 1) return [];

        if (!cachedStickers) {
            try {
                const res = await StickerService.getMyPacks();
                if (res.success && Array.isArray(res.data)) {
                    cachedStickers = res.data.flatMap(pack => {
                        if (!Array.isArray(pack.stickers)) return [];
                        return pack.stickers.map(sticker => ({
                            ...sticker,
                            pack_short_name: pack.short_name
                        }));
                    });
                } else {
                    cachedStickers = [];
                }
            } catch (e) {
                console.error("Помилка завантаження кешу:", e);
                cachedStickers = [];
            }
        }

        const lowerQuery = query.toLowerCase();
        return cachedStickers.filter(sticker => {
            if (!sticker || !sticker.shortcode) return false;
            const matchShortcode = sticker.shortcode.toLowerCase().includes(lowerQuery);
            const matchKeywords = sticker.keywords && sticker.keywords.toLowerCase().includes(lowerQuery);
            return matchShortcode || matchKeywords;
        }).slice(0, 20);
    },

    render: () => {
        let component;
        let popup;

        return {
            onStart: props => {
                component = new ReactRenderer(SuggestionList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props) {
                component?.updateProps(props);

                if (!props.clientRect || !popup) return;
                popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },

            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup?.[0].hide();
                    return true;
                }
                return component?.ref?.onKeyDown(props);
            },

            onExit() {
                if (popup && popup[0]) {
                    popup[0].destroy();
                    popup = null;
                }
                if (component) {
                    component.destroy();
                    component = null;
                }
            },
        };
    },
};