export const extractPreviewText = (textStr, t) => {
    if (!textStr) return '';
    try {
        const parsed = typeof textStr === 'string' ? JSON.parse(textStr) : textStr;

        if (parsed?.type === 'doc') {
            let text = '';
            const extract = (node) => {
                if (node.type === 'text') text += node.text;
                if (node.type === 'customSticker') text += '[' + (node.attrs?.shortcode) + '] ';
                if (node.content) node.content.forEach(extract);
            };
            extract(parsed);
            return text.trim() || t('messages.media');
        }
        return String(textStr);
    } catch {
        return String(textStr);
    }
};