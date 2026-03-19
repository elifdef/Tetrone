import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import MessageService from '../services/chat.service';
import { notifyError } from "../components/common/Notify";
import { AuthContext } from '../context/AuthContext';

export const useMessages = (slug, echoInstance) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [chatWasDeletedExternally, setChatWasDeletedExternally] = useState(false);

    const pageRef = useRef(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [targetIsTyping, setTargetIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!slug || !echoInstance || !user) return;

        setChatWasDeletedExternally(false);

        const chatChannelName = `chat.${slug}`;
        const chatChannel = echoInstance.private(chatChannelName);

        chatChannel.listenForWhisper('typing', () => {
            setTargetIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTargetIsTyping(false), 2000);
        });

        const userChannelName = `App.Models.User.${user.id}`;
        const userChannel = echoInstance.private(userChannelName);

        userChannel.listen('.messages_read', (event) => {
            if (event.chat_slug === slug) {
                setMessages(prev => prev.map(msg =>
                    (msg.sender_id === user.id && !msg.read_at)
                        ? { ...msg, read_at: new Date().toISOString() }
                        : msg
                ));
            }
        });

        userChannel.listen('.chat_deleted', (event) => {
            if (event.chat_slug === slug) {
                setChatWasDeletedExternally(true);
            }
        });

        userChannel.listen('.user_blocked', (event) => {
            setChatWasDeletedExternally(true);
        });

        return () => {
            if (chatChannel) chatChannel.stopListeningForWhisper('typing');
            if (userChannel) {
                userChannel.stopListening('.messages_read');
                userChannel.stopListening('.chat_deleted');
                userChannel.stopListening('.user_blocked');
            }
        };
    }, [slug, echoInstance, user]);

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

        const res = await MessageService.getMessages(slug, currentPage);

        if (res.success) {
            const items = res.data?.data || res.data || [];
            const meta = res.meta || res.data?.meta;
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

            setHasMore(meta && meta.current_page < meta.last_page);
            if (!isLoadMore) MessageService.markAsRead(slug).catch(e => console.error("Failed to mark as read", e));
        } else {
            if (!silent) notifyError(res.message);
        }

        setIsLoadingInitial(false);
        setIsLoadingMore(false);
    }, [slug, t]);

    const loadMoreMessages = () => {
        if (!isLoadingMore && hasMore) fetchMessages({ isLoadMore: true });
    };

    const sendMessage = async (text, files = [], sharedPostId = null, replyToId = null) => {
        if (!text && files.length === 0 && !sharedPostId) return false;

        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            sender_id: user.id,
            text: text,
            files: files.map(f => ({ name: f.name, url: URL.createObjectURL(f) })),
            isMine: true,
            created_at: new Date().toISOString(),
            status: 'sending'
        };

        setMessages(prev => [...prev, tempMessage]);
        
        const res = await MessageService.sendMessage(slug, text, files, sharedPostId, replyToId);

        if (res.success) {
            await fetchMessages({ silent: true });
            return true;
        } else {
            setMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, status: 'error', errorText: res.message }
                    : msg
            ));
            return false;
        }
    };

    const updateMessage = async (messageId, text, newFiles = [], deletedMedia = []) => {
        const res = await MessageService.updateMessage(slug, messageId, text, newFiles, deletedMedia);
        if (res.success) {
            await fetchMessages({ silent: true });
            return true;
        }
        notifyError(res.message);
        return false;
    };

    const deleteMessage = async (messageId) => {
        const res = await MessageService.deleteMessage(slug, messageId);
        if (res.success) setMessages(prev => prev.filter(msg => msg.id !== messageId));
        else notifyError(res.message);
    };

    const togglePin = async (messageId) => {
        const res = await MessageService.togglePin(slug, messageId);
        if (res.success) await fetchMessages({ silent: true });
        else notifyError(res.message);
    };

    return { messages, isLoadingInitial, isLoadingMore, hasMore, targetIsTyping, chatWasDeletedExternally, fetchMessages, loadMoreMessages, sendMessage, updateMessage, deleteMessage, togglePin, emitTyping };
};