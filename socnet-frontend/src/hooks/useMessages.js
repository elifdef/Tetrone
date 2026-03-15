import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import chatService  from '../services/chat.service'; 
import { notifyError, notifySuccess } from "../components/common/Notify";

export const useMessages = (slug, echoInstance) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);

    const pageRef = useRef(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [targetIsTyping, setTargetIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Підключення до каналу та прослуховування друкування
    useEffect(() => {
        if (!slug || !echoInstance) return;

        const channelName = `chat.${slug}`;
        const channel = echoInstance.private(channelName);

        channel.listenForWhisper('typing', () => {
            setTargetIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setTargetIsTyping(false);
            }, 2000);
        });

        return () => {
            if (channel) channel.stopListeningForWhisper('typing');
        };
    }, [slug, echoInstance]);

    const emitTyping = useCallback(() => {
        if (!slug || !echoInstance) return;
        echoInstance.private(`chat.${slug}`).whisper('typing', { typing: true });
    }, [slug, echoInstance]);

    const fetchMessages = useCallback(async ({ isLoadMore = false, silent = false } = {}) => {
        if (!slug) return;

        const currentPage = isLoadMore ? pageRef.current + 1 : 1;

        if (!silent) {
            if (isLoadMore) setIsLoadingMore(true);
            else setIsLoadingInitial(true);
        }

        try {
            // Тепер chatService повертає { items, meta } завдяки нашому рефакторингу!
            const { items, meta } = await chatService.getMessages(slug, currentPage);
            
            // Laravel віддає від новіших до старіших, тому перевертаємо для чату
            const reversedData = [...items].reverse();

            if (isLoadMore) {
                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const uniqueNew = reversedData.filter(m => !existingIds.has(m.id));
                    return [...uniqueNew, ...prev];
                });
                pageRef.current = currentPage;
            } else {
                setMessages(reversedData);
                pageRef.current = 1;
            }

            // Використовуємо meta для перевірки наявності наступних сторінок
            setHasMore(meta && meta.current_page < meta.last_page);
            
        } catch (err) {
            if (!silent) {
                // Нова обробка помилок для fetchClient
                notifyError(err.data?.message || err.message || t('messages.errors.load_failed'));
            }
        } finally {
            setIsLoadingInitial(false);
            setIsLoadingMore(false);
        }
    }, [slug, t]);

    const loadMoreMessages = () => {
        if (!isLoadingMore && hasMore) {
            fetchMessages({ isLoadMore: true });
        }
    };

    const sendMessage = async (text, files = [], sharedPostId = null, replyToId = null) => {
        if (!text && files.length === 0 && !sharedPostId) return;
        try {
            await chatService.sendMessage(slug, text, files, sharedPostId, replyToId);
            await fetchMessages({ silent: true });
        } catch (err) {
            notifyError(err.data?.message || err.message || t('messages.errors.send_failed'));
        }
    };

    const updateMessage = async (messageId, text, newFiles = [], deletedMedia = []) => {
        try {
            await chatService.updateMessage(slug, messageId, text, newFiles, deletedMedia);
            await fetchMessages({ silent: true });
            notifySuccess(t('messages.success.updated'));
        } catch (err) {
            notifyError(err.data?.message || err.message || t('messages.errors.update_failed'));
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            await chatService.deleteMessage(slug, messageId);
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (err) {
            notifyError(err.data?.message || err.message || t('messages.errors.delete_failed'));
        }
    };

    const togglePin = async (messageId) => {
        try {
            await chatService.togglePin(slug, messageId);
            await fetchMessages({ silent: true });
        } catch (err) {
            notifyError(err.data?.message || err.message || t('messages.errors.pin_failed'));
        }
    };

    return {
        messages, 
        isLoadingInitial, 
        isLoadingMore, 
        hasMore, 
        targetIsTyping,
        fetchMessages, 
        loadMoreMessages, 
        sendMessage, 
        updateMessage, 
        deleteMessage, 
        togglePin, 
        emitTyping
    };
};