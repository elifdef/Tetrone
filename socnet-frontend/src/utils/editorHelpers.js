export const isEditorEmpty = (doc) => {
    if (!doc)
        return true;

    if (typeof doc === 'string')
        return !doc.trim(); // Фолбек для старого тексту

    if (doc.type === 'doc' && Array.isArray(doc.content)) {
        if (doc.content.length === 0)
            return true;

        // якщо це єдиний параграф і в ньому немає контенту (тексту або емодзі)
        if (doc.content.length === 1 && doc.content[0].type === 'paragraph')
            return !doc.content[0].content || doc.content[0].content.length === 0;
    }
    return false;
};

export const isOnlyStickers = (content) => {
    if (!content || !content.content) return false;

    let hasSticker = false;
    let hasText = false;

    const traverse = (node) => {
        // якщо знаходимо текст який не є пустим пробілом
        if (node.type === 'text' && node.text.trim() !== '') {
            hasText = true;
        }
        // якщо знаходимо емодзі
        if (node.type === 'customSticker') {
            hasSticker = true;
        }
        if (node.content) {
            node.content.forEach(traverse);
        }
    };

    traverse(content);

    return hasSticker && !hasText;
};