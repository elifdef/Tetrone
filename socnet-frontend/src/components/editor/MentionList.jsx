import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const MentionList = forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [props.items]);

    const selectItem = index => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.username, label: item.username });
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

    return (
        <div className="tetrone-mention-dropdown">
            {props.items.length > 0 ? (
                props.items.map((item, index) => {
                    const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ') || item.username;

                    return (
                        <button
                            className={`tetrone-mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
                            key={index}
                            onClick={() => selectItem(index)}
                        >
                            {item.avatar && (
                                <img src={item.avatar} alt="avatar" className="tetrone-mention-avatar" />
                            )}
                            <div className="tetrone-mention-info">
                                <span className="tetrone-mention-name">{fullName}</span>
                                <span className="tetrone-mention-username">@{item.username}</span>
                            </div>
                        </button>
                    );
                })
            ) : (
                <div className="tetrone-mention-item empty">NOT FOUND NOT TRANSLATED</div>
            )}
        </div>
    );
});

export default MentionList;