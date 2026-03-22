import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useInbox } from '../hooks/useInbox';
import { useMessages } from '../hooks/useMessages';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import Messages from '../components/messages/Messages';
import MessagesOld from '../components/messages/MessagesOld';
import MessageService from '../services/chat.service';
import FriendService from '../services/friend.service';
import ChatInfoModal from '../components/messages/ChatInfoModal';
import { notifyError, notifySuccess } from '../components/common/Notify';

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
        isLoadingInitial, isLoadingMore, hasMore, targetIsTyping, emitTyping, chatWasDeletedExternally
    } = useMessages(dmSlug, echoInstance);

    useEffect(() => {
        if (chatWasDeletedExternally) {
            notifyError(t('messages.chat_was_deleted_or_blocked'));
            setSearchParams({});
            fetchChats();
        }
    }, [chatWasDeletedExternally, fetchChats, setSearchParams, t]);

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

    const activeChatObj = chats.find(c => c.slug === dmSlug);

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

    const handleDeleteClick = async (msgId) => {
        const confirmed = await openConfirm(t('messages.delete_confirm'), t('common.delete'));
        if (confirmed) {
            await deleteMessage(msgId);
            fetchChats();
        }
    };

    const handleFileChange = (e) => {
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
    };

    const handleRemoveFile = (indexToRemove) => setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));

    const handleDeleteChat = async () => {
        closeModal();
        let isForBoth = false;
        const confirmContent = (
            <div className="tetrone-delete-chat-modal">
                <p>{t('messages.delete_chat_confirm')}</p>
                <label className="tetrone-checkbox-label" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        onChange={(e) => { isForBoth = e.target.checked; }}
                    />
                    {t('messages.delete_for_both')}
                </label>
            </div>
        );

        openCustom(
            <div className="tetrone-modal-dialog">
                {confirmContent}
                <div className="tetrone-modal-actions">
                    <button className="tetrone-btn-cancel" onClick={() => closeModal()}>{t('common.cancel')}</button>
                    <button className="tetrone-btn-danger" onClick={async () => {
                        closeModal();
                        const res = await MessageService.deleteChat(dmSlug, isForBoth);
                        if (res.success) {
                            setSearchParams({});
                            fetchChats();
                        } else {
                            notifyError(res.message || t('error.delete_data'));
                        }
                    }}>{t('common.delete')}</button>
                </div>
            </div>
        );
    };

    const handleBlockUser = async () => {
        closeModal();
        const targetUser = activeChatObj?.target_user?.username;
        if (!targetUser) return;

        const confirmed = await openConfirm(t('common.are_u_sure', 'Ви впевнені?'), t('common.to_block'));
        if (confirmed) {
            const res = await FriendService.blockUser(targetUser);
            if (res.success) {
                notifySuccess(res.message);
                setSearchParams({});
                fetchChats();
            } else {
                notifyError(res.message || t('error.block_user'));
            }
        }
    };

    const handleScrollToMessage = (msgId) => {
        const el = document.getElementById(`message-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('tetrone-modern-highlight-msg');
            setTimeout(() => el.classList.remove('tetrone-modern-highlight-msg'), 2000);
        }
    };

    const handleOpenInfo = () => {
        openCustom(
            <ChatInfoModal
                chat={activeChatObj}
                messages={messages}
                onClose={closeModal}
                onScrollToMessage={handleScrollToMessage}
                onDeleteChat={handleDeleteChat}
                onBlockUser={handleBlockUser}
            />
        );
    };

    const childProps = {
        isLoadingInitial, isLoadingMore, hasMore,
        onLoadMore: loadMoreMessages,
        onOpenInfo: handleOpenInfo,
        onDeleteChatClick: handleDeleteChat,
        currentUser, chats, messages,
        activeChat: activeChatObj,
        dmSlug, text, setText, files, editingMessage,
        handleSend, handleSelectChat, handleBackToInbox,
        handleEditClick, handleCancelEdit, handleDelete: handleDeleteClick,
        replyingTo, setReplyingTo, togglePin, handleCancelReplyEdit,
        handleFileChange, handleRemoveFile,
        isTyping: targetIsTyping, onTyping: emitTyping,
    };

    return (
        <>
            {localStorage.getItem('old_style')
                ? <MessagesOld {...childProps} />
                : <Messages {...childProps} />
            }
        </>
    );
}