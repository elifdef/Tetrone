import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const SuggestionList = forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = index => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (!props.items || props.items.length === 0) {
        return null;
    }

    return (
        <div className="tetrone-sticker-inline-suggest">
            {props.items.map((item, index) => (
                <div
                    key={item.id}
                    className={`tetrone-sticker-suggest-item ${index === selectedIndex ? 'active' : ''}`}
                    onClick={() => selectItem(index)}
                >
                    <img src={item.url} alt={item.shortcode} />
                    <span>:{item.shortcode}:</span>
                </div>
            ))}
        </div>
    );
});

SuggestionList.displayName = 'SuggestionList';

export default SuggestionList;