import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useInbox } from '../components/messages/hooks/useInbox';
import { useMessages } from '../components/messages/hooks/useMessages';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import Messages from '../components/messages/Messages';
import MessagesOld from '../components/messages/MessagesOld';
import MessageService from '../services/chat.service';
import FriendService from '../services/friend.service';
import ChatInfoModal from '../components/modals/ChatInfoModal';
import { notifyError, notifySuccess } from '../components/common/Notify';

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function MessagesPage() {
    const { t } = useTranslation();
    usePageTitle(t('common.messages'));

    const [searchParams, setSearchParams] = useSearchParams();
    const dmSlug = searchParams.get('dm');

    const { user: currentUser } = useContext(AuthContext);
    const { chats, fetchChats } = useInbox();
    const { setUnreadMessagesCount, incomingMessage, echoInstance } = useContext(NotificationContext);
    const { openConfirm, openCustom, closeModal } = useModal();

    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);

    const {
        messages, fetchMessages, loadMoreMessages, sendMessage, updateMessage, deleteMessage, togglePin,
        isLoadingInitial, isLoadingMore, hasMore, targetIsTyping, emitTyping, chatWasDeletedExternally,
        currentChatInfo
    } = useMessages(dmSlug, echoInstance);

    const refreshInbox = useCallback(() => {
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        if (chatWasDeletedExternally) {
            notifyError(t('messages.chat_was_deleted_or_blocked'));
            setSearchParams({});
            refreshInbox();
        }
    }, [chatWasDeletedExternally, refreshInbox, setSearchParams, t]);

    useEffect(() => {
        refreshInbox();
    }, [refreshInbox]);

    useEffect(() => {
        if (chats && chats.length > 0) {
            const totalUnread = chats.reduce((sum, chat) => {
                if (chat.slug === dmSlug) return sum;
                return sum + (chat.unread_count || 0);
            }, 0);
            setUnreadMessagesCount(totalUnread);
        } else {
            setUnreadMessagesCount(0);
        }
    }, [chats, dmSlug, setUnreadMessagesCount]);

    useEffect(() => {
        if (dmSlug) {
            fetchMessages();
        } else {
            setText('');
            setFiles([]);
            setEditingMessage(null);
        }
    }, [dmSlug, fetchMessages]);

    useEffect(() => {
        if (incomingMessage) {
            refreshInbox();
            if (incomingMessage.chat_slug === dmSlug) {
                fetchMessages({ silent: true });
            }
        }
    }, [incomingMessage, dmSlug, fetchMessages, refreshInbox]);

    useEffect(() => {
        const handlePaste = (e) => {
            if (!dmSlug) return;
            if (e.clipboardData && e.clipboardData.files.length > 0) {
                const pastedFiles = Array.from(e.clipboardData.files);
                setFiles(prev => {
                    const combined = [...prev, ...pastedFiles];
                    if (combined.length > 10) {
                        notifyError(t('error.max_files'));
                        return combined.slice(0, 10);
                    }
                    return combined;
                });
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [dmSlug, t]);

    const activeChatObj = useMemo(() => {
        return dmSlug ? (chats.find(c => c.slug === dmSlug) || currentChatInfo) : null;
    }, [dmSlug, chats, currentChatInfo]);

    const displayChats = useMemo(() => {
        const mapped = chats.map(c => c.slug === dmSlug ? { ...c, unread_count: 0 } : c);
        if (currentChatInfo && !chats.find(c => c.slug === currentChatInfo.slug)) {
            mapped.unshift({
                slug: currentChatInfo.slug,
                target_user: currentChatInfo.target_user,
                updated_at: new Date().toISOString(),
                last_message: t('empty.messages'),
                last_message_sender_id: null,
                unread_count: 0
            });
        }
        return mapped;
    }, [chats, dmSlug, currentChatInfo, t]);

    const getReplyName = useCallback(() => {
        if (!replyingTo) return '';
        return replyingTo.isMine ? currentUser?.first_name : activeChatObj?.target_user?.first_name;
    }, [replyingTo, currentUser, activeChatObj]);

    const handleSelectChat = useCallback((slug) => {
        setSearchParams({ dm: slug });
    }, [setSearchParams]);

    const handleBackToInbox = useCallback(() => {
        setSearchParams({});
        refreshInbox();
    }, [setSearchParams, refreshInbox]);

    const handleSend = async () => {
        const isTextEmpty = !text ||
            (typeof text === 'object' && text.content?.length === 1 && !text.content[0].content) ||
            (typeof text === 'string' && !text.trim());

        if (isTextEmpty && files.length === 0) return;

        const textToSend = typeof text === 'object' ? JSON.stringify(text) : text;

        let success = false;
        if (editingMessage) {
            success = await updateMessage(editingMessage.id, textToSend, files, []);
            if (success) setEditingMessage(null);
        } else {
            success = await sendMessage(textToSend, files, null, replyingTo ? replyingTo.id : null);
        }

        if (success) {
            setText('');
            setFiles([]);
            setReplyingTo(null);
            refreshInbox();
        }
    };

    const handleCancelReplyEdit = useCallback(() => {
        setEditingMessage(null);
        setReplyingTo(null);
        setText('');
        setFiles([]);
    }, []);

    const handleEditClick = useCallback((msg) => {
        setEditingMessage(msg);
        try {
            setText(typeof msg.text === 'string' ? JSON.parse(msg.text) : msg.text);
        } catch {
            setText(msg.text || '');
        }
        setFiles([]);
    }, []);

    const handleDeleteClick = useCallback(async (msgId) => {
        const confirmed = await openConfirm(t('messages.delete_confirm'), t('action.delete'));
        if (confirmed) {
            await deleteMessage(msgId);
            refreshInbox();
        }
    }, [openConfirm, deleteMessage, refreshInbox, t]);

    const handleFileChange = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prev => {
                const combined = [...prev, ...selectedFiles];
                if (combined.length > 10) {
                    notifyError(t('error.max_files'));
                    return combined.slice(0, 10);
                }
                return combined;
            });
            e.target.value = null;
        }
    }, [t]);

    const handleRemoveFile = useCallback((indexToRemove) => {
        setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    }, []);

    const handleDeleteChat = useCallback(async () => {
        closeModal();
        let isForBoth = false;
        openCustom(
            <div className="tetrone-modal-dialog">
                <div className="tetrone-modal-header">
                    <h3>{t('messages.delete_chat')}</h3>
                    <button className="tetrone-modal-close" onClick={() => closeModal()}>
                        <CloseIcon />
                    </button>
                </div>
                <div className="tetrone-modal-body">
                    <p className="tetrone-modal-message">{t('messages.delete_chat_confirm')}</p>
                    <label className="tetrone-checkbox-label">
                        <input type="checkbox" onChange={(e) => { isForBoth = e.target.checked; }} />
                        <span>{t('messages.delete_for_both')}</span>
                    </label>
                </div>
                <div className="tetrone-modal-footer">
                    <button className="tetrone-btn-ghost" onClick={() => closeModal()}>{t('action.cancel')}</button>
                    <button className="tetrone-btn-danger" onClick={async () => {
                        closeModal();
                        const res = await MessageService.deleteChat(dmSlug, isForBoth);
                        if (res.success) {
                            setSearchParams({});
                            refreshInbox();
                        } else {
                            notifyError(res.message);
                        }
                    }}>{t('action.delete')}</button>
                </div>
            </div>
        );
    }, [closeModal, openCustom, t, dmSlug, setSearchParams, refreshInbox]);

    const handleBlockUser = useCallback(async () => {
        closeModal();
        const targetUser = activeChatObj?.target_user?.username;
        if (!targetUser) return;

        const confirmed = await openConfirm(t('action.are_u_sure'), t('action.block'));
        if (confirmed) {
            const res = await FriendService.blockUser(targetUser);
            if (res.success) {
                notifySuccess(res.message);
                setSearchParams({});
                refreshInbox();
            } else {
                notifyError(res.message);
            }
        }
    }, [closeModal, activeChatObj, openConfirm, t, setSearchParams, refreshInbox]);

    const handleScrollToMessage = useCallback((msgId) => {
        const el = document.getElementById(`message-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('tetrone-modern-highlight-msg');
            setTimeout(() => el.classList.remove('tetrone-modern-highlight-msg'), 2000);
        }
    }, []);

    const handleOpenInfo = useCallback(() => {
        openCustom(<ChatInfoModal chat={activeChatObj} messages={messages} onClose={closeModal} />);
    }, [openCustom, activeChatObj, messages, closeModal]);

    const childProps = {
        isLoadingInitial, isLoadingMore, hasMore, onLoadMore: loadMoreMessages,
        onOpenInfo: handleOpenInfo, onDeleteChatClick: handleDeleteChat,
        currentUser, chats: displayChats, replyingToName: getReplyName(),
        messages, activeChat: activeChatObj,
        dmSlug, text, setText, files, editingMessage,
        handleSend, handleSelectChat, handleBackToInbox,
        handleEditClick, handleDelete: handleDeleteClick,
        replyingTo, setReplyingTo, togglePin, handleCancelReplyEdit,
        handleFileChange, handleRemoveFile, isTyping: targetIsTyping, onTyping: emitTyping,
    };

    return (
        <>
            {localStorage.getItem('old_style') ? <MessagesOld {...childProps} /> : <Messages {...childProps} />}
        </>
    );
}