import React, { useMemo, useState, useRef, useCallback } from 'react';
import { generateHTML } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { CustomStickerNode } from '../editor/CustomStickerNode';
import StickerTooltip from '../editor/StickerTooltip';

export default function RichText({ text, className = "tetrone-post-text" }) {
    const containerRef = useRef(null);
    const [hoveredStickerId, setHoveredStickerId] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const hideTimeoutRef = useRef(null);

    const htmlContent = useMemo(() => {
        if (!text || typeof text !== 'object') return null;
        try {
            return generateHTML(text, [
                StarterKit,
                CustomStickerNode,
                Mention.configure({ HTMLAttributes: { class: 'mention' } })
            ]);
        } catch (error) {
            return null;
        }
    }, [text]);

    const handleMouseOver = useCallback((e) => {
        const target = e.target;
        if (target && target.classList.contains('tetrone-micro-sticker')) {
            clearTimeout(hideTimeoutRef.current);
            const emojiId = target.getAttribute('data-sticker-id');
            const rect = target.getBoundingClientRect();

            if (emojiId && hoveredStickerId !== emojiId) {
                setTooltipPosition({
                    x: rect.left + window.scrollX + (rect.width / 2),
                    y: rect.top + window.scrollY - 10
                });
                setHoveredStickerId(emojiId);
            }
        }
    }, [hoveredStickerId]);

    const handleMouseOut = useCallback((e) => {
        const target = e.target;
        if (target && target.classList.contains('tetrone-micro-sticker')) {
            hideTimeoutRef.current = setTimeout(() => {
                setHoveredStickerId(null);
            }, 300);
        }
    }, []);

    const handleTooltipMouseEnter = () => {
        clearTimeout(hideTimeoutRef.current);
    };

    const handleTooltipMouseLeave = () => {
        setHoveredStickerId(null);
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
            />
            {hoveredStickerId && (
                <div
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
                    style={{ display: 'contents' }}
                >
                    <StickerTooltip
                        emojiId={hoveredStickerId}
                        position={tooltipPosition}
                    />
                </div>
            )}
        </>
    );
}