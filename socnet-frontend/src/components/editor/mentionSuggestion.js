import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from './MentionList';
import userService from '../../services/user.service';

let debounceTimeout;

const mentionSuggestion = {
    char: '@',

    items: ({ query }) => {
        return new Promise((resolve) => {
            clearTimeout(debounceTimeout);

            if (query.length < 4) {
                resolve([]);
                return;
            }

            // дебаунс 400 мілісекунд
            debounceTimeout = setTimeout(async () => {
                try {
                    const res = await userService.searchUsers(query);

                    const users = Array.isArray(res.data) ? res.data : [];

                    // тільки перші 5 результатів
                    resolve(users.slice(0, 5));
                } catch (error) {
                    console.error('Mention search error:', error);
                    resolve([]);
                }
            }, 400);
        });
    },

    render: () => {
        let component;
        let popup;

        return {
            onStart: props => {
                component = new ReactRenderer(MentionList, {
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
                component.updateProps(props);
                if (!props.clientRect) return;
                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }
                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};

export default mentionSuggestion;