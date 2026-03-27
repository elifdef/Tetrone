export const isEditorEmpty = (doc) => {
    if (!doc || typeof doc !== 'object') return true;

    let hasContent = false;
    const checkNode = (node) => {
        if (node.type === 'customSticker') { hasContent = true; return; }
        if (node.type === 'text' && node.text && node.text.trim() !== '') { hasContent = true; return; }
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
                checkNode(child);
                if (hasContent) return;
            }
        }
    };

    checkNode(doc);
    return !hasContent;
};

export const isOnlyStickers = (doc) => {
    if (!doc || typeof doc !== 'object') return false;

    let hasSticker = false;
    let hasText = false;
    const traverse = (node) => {
        if (node.type === 'text' && node.text && node.text.trim() !== '') hasText = true;
        if (node.type === 'customSticker') hasSticker = true;
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) traverse(child);
        }
    };

    traverse(doc);
    return hasSticker && !hasText;
};