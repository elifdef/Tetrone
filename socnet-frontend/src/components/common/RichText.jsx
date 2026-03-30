import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import { CustomStickerNode } from '../editor/CustomStickerNode';
import StickerTooltip from '../editor/StickerTooltip';

const SpoilerMark = Mark.create({
    name: 'spoiler',
    parseHTML() { return [{ tag: 'span[data-spoiler]' }]; },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-spoiler': 'true', class: 'tetrone-spoiler' }), 0];
    },
});

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() { return { types: ['textStyle'] }; },
    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                fontSize: {
                    default: null,
                    parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                    renderHTML: attributes => {
                        if (!attributes.fontSize) return {};
                        return { style: `font-size: ${attributes.fontSize}` };
                    },
                },
            },
        }];
    },
});

export default function RichText({ text, className = "tetrone-post-text" }) {
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);

    const [activeStickerId, setActiveStickerId] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isPinned, setIsPinned] = useState(false);

    const hideTimeoutRef = useRef(null);

    const htmlContent = useMemo(() => {
        if (!text || typeof text !== 'object') return null;
        try {
            return generateHTML(text, [
                StarterKit,
                Underline,
                TextStyle,
                Color,
                FontSize,
                SpoilerMark,
                CustomStickerNode,
                Mention.configure({ HTMLAttributes: { class: 'mention' } })
            ]);
        } catch (error) {
            return null;
        }
    }, [text]);
    const showTooltip = (target, pinned = false) => {
        clearTimeout(hideTimeoutRef.current);

        const packname = target.getAttribute('data-pack-name');
        
        const rect = target.getBoundingClientRect();

        if (packname) {
            setTooltipPosition({
                x: rect.left + window.scrollX + (rect.width / 2),
                y: rect.top + window.scrollY - 10
            });

            setActiveStickerId(packname);
            if (pinned) setIsPinned(true);
        }
    };
    const handleMouseOver = useCallback((e) => {
        if (isPinned) return;
        const target = e.target;
        if (target && target.classList.contains('tetrone-micro-sticker')) {
            showTooltip(target, false);
        }
    }, [isPinned]);

    const handleMouseOut = useCallback((e) => {
        if (isPinned) return;
        const target = e.target;
        if (target && target.classList.contains('tetrone-micro-sticker')) {
            hideTimeoutRef.current = setTimeout(() => { setActiveStickerId(null); }, 300);
        }
    }, [isPinned]);

    const handleClick = useCallback((e) => {
        const target = e.target;
        if (target && target.classList.contains('tetrone-spoiler')) {
            target.classList.toggle('revealed');
            return;
        }

        if (target && target.classList.contains('tetrone-micro-sticker')) {
            e.preventDefault();
            e.stopPropagation();

            const shortcode = target.getAttribute('data-shortcode');

            if (isPinned && activeStickerId === shortcode) {
                setIsPinned(false);
                setActiveStickerId(null);
            } else {
                showTooltip(target, true);
            }
        }
    }, [isPinned, activeStickerId]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (isPinned) {
                if (tooltipRef.current && !tooltipRef.current.contains(e.target) && !e.target.classList.contains('tetrone-micro-sticker')) {
                    setIsPinned(false);
                    setActiveStickerId(null);
                }
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && activeStickerId) {
                setIsPinned(false);
                setActiveStickerId(null);
            }
        };
        document.addEventListener('click', handleGlobalClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPinned, activeStickerId]);

    const handleTooltipMouseEnter = () => { if (!isPinned) clearTimeout(hideTimeoutRef.current); };
    const handleTooltipMouseLeave = () => {
        if (!isPinned) {
            hideTimeoutRef.current = setTimeout(() => { setActiveStickerId(null); }, 300);
        }
    };

    if (!htmlContent) return null;

    return (
        <>
            <div
                ref={containerRef}
                className={className}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                onClick={handleClick}
            />
            {activeStickerId && (
                <div
                    ref={tooltipRef}
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
                    className="tetrone-tooltip-wrapper"
                >
                    <StickerTooltip
                        shortcode={activeStickerId}
                        position={tooltipPosition}
                    />
                </div>
            )}
        </>
    );
}