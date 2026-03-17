import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useInbox } from '../hooks/useInbox';
import { useMessages } from '../hooks/useMessages';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import Messages from '../components/messages/Messages';
import MessagesOld from '../components/messages/MessagesOld';
import ActionModal from '../components/common/ActionModal';
import MessageService from '../services/chat.service';
import ChatInfoModal from '../components/messages/ChatInfoModal';
import { notifyError } from '../components/common/Notify';

export default function MessagesPage() {
    const { t } = useTranslation();
    usePageTitle(t('common.messages'));

    const [searchParams, setSearchParams] = useSearchParams();
    const dmSlug = searchParams.get('dm');

    const { user: currentUser } = useContext(AuthContext);
    const { chats, fetchChats } = useInbox();

    const { setUnreadMessagesCount, incomingMessage, echoInstance } = useContext(NotificationContext);

    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);

    const {
        messages, fetchMessages, loadMoreMessages, sendMessage, updateMessage, deleteMessage, togglePin,
        isLoadingInitial, isLoadingMore, hasMore, targetIsTyping, emitTyping
    } = useMessages(dmSlug, echoInstance);

    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [deleteForBoth, setDeleteForBoth] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        if (chats && chats.length > 0) {
            const totalUnread = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
            setUnreadMessagesCount(totalUnread);
        } else {
            setUnreadMessagesCount(0);
        }
    }, [chats, setUnreadMessagesCount]);

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
            fetchChats();
            if (incomingMessage.chat_slug === dmSlug) {
                fetchMessages({ silent: true });
            }
        }
    }, [incomingMessage, dmSlug, fetchMessages, fetchChats]);

    useEffect(() => {
        const handlePaste = (e) => {
            if (!dmSlug) return;

            if (e.clipboardData && e.clipboardData.files.length > 0) {
                const pastedFiles = Array.from(e.clipboardData.files);

                setFiles(prev => {
                    const combined = [...prev, ...pastedFiles];
                    if (combined.length > 10) {
                        notifyError(t('messages.max_files_exceeded'));
                        return combined.slice(0, 10);
                    }
                    return combined;
                });
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [dmSlug, t]);

    const handleSelectChat = (slug) => setSearchParams({ dm: slug });
    const handleBackToInbox = () => setSearchParams({});

    const handleSend = async () => {
        if (!text.trim() && files.length === 0) return;

        let success = false;

        if (editingMessage) {
            success = await updateMessage(editingMessage.id, text, files, []);
            if (success) setEditingMessage(null);
        } else {
            success = await sendMessage(text, files, null, replyingTo ? replyingTo.id : null);
        }

        if (success) {
            setText('');
            setFiles([]);
            setReplyingTo(null);
            fetchChats();
        }
    };

    const handleCancelReplyEdit = () => {
        setEditingMessage(null);
        setReplyingTo(null);
        setText('');
        setFiles([]);
    };

    const handleEditClick = (msg) => {
        setEditingMessage(msg);
        setText(msg.text || '');
        setFiles([]);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setText('');
        setFiles([]);
    };

    const handleDeleteClick = (msgId) => setMessageToDelete(msgId);

    const confirmDelete = async (shouldDelete) => {
        if (shouldDelete && messageToDelete) {
            await deleteMessage(messageToDelete);
            fetchChats();
        }
        setMessageToDelete(null);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            setFiles(prev => {
                const combined = [...prev, ...selectedFiles];
                if (combined.length > 10) {
                    notifyError(t('messages.max_files_exceeded'));
                    return combined.slice(0, 10);
                }
                return combined;
            });

            e.target.value = null;
        }
    };

    const handleRemoveFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const confirmDeleteChat = async (shouldDelete) => {
        if (shouldDelete && chatToDelete) {
            const res = await MessageService.deleteChat(chatToDelete, deleteForBoth);
            if (res.success) {
                setSearchParams({});
                fetchChats();
            } else {
                notifyError(res.message);
            }
        }
        setChatToDelete(null);
        setDeleteForBoth(false);
    };

    const activeChatObj = chats.find(c => c.slug === dmSlug);

    const childProps = {
        isLoadingInitial, isLoadingMore, hasMore,
        onLoadMore: loadMoreMessages,
        onOpenInfo: () => setIsInfoModalOpen(true),
        onDeleteChatClick: () => setChatToDelete(dmSlug),
        currentUser, chats, messages,
        activeChat: activeChatObj,
        dmSlug, text, setText, files, editingMessage,
        handleSend, handleSelectChat, handleBackToInbox,
        handleEditClick, handleCancelEdit, handleDelete: handleDeleteClick,
        replyingTo, setReplyingTo, togglePin, handleCancelReplyEdit,
        handleFileChange, handleRemoveFile,
        isTyping: targetIsTyping, onTyping: emitTyping,
    };

    const handleScrollToMessage = (msgId) => {
        const el = document.getElementById(`message-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('socnet-tg-highlight-msg');
            setTimeout(() => el.classList.remove('socnet-tg-highlight-msg'), 2000);
        }
    };

    return (
        <>
            {localStorage.getItem('old_style')
                ? <MessagesOld {...childProps} />
                : <Messages {...childProps} />
            }

            <ActionModal
                isOpen={!!messageToDelete}
                onClose={() => setMessageToDelete(null)}
                type="confirm"
                message={t('messages.delete_confirm')}
                btnSubmit={t('common.delete')}
                btnCancel={t('common.cancel')}
                onResolve={confirmDelete}
            />

            <ActionModal
                isOpen={!!chatToDelete}
                onClose={() => setChatToDelete(null)}
                type="confirm"
                message={
                    <div className="socnet-delete-chat-modal">
                        <p>{t('messages.delete_chat_confirm')}</p>
                        <label className="socnet-checkbox-label">
                            <input
                                type="checkbox"
                                checked={deleteForBoth}
                                onChange={(e) => setDeleteForBoth(e.target.checked)}
                            />
                            {t('messages.delete_for_both')}
                        </label>
                    </div>
                }
                btnSubmit={t('common.delete')}
                btnCancel={t('common.cancel')}
                onResolve={confirmDeleteChat}
            />

            <ChatInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                chat={activeChatObj}
                messages={messages}
                onScrollToMessage={handleScrollToMessage}
                onDeleteChat={() => setChatToDelete(dmSlug)}
                onBlockUser={() => console.log('Тут логіка блокування')}
            />
        </>
    );
}