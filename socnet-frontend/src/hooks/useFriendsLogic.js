import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import FriendService from "../services/friend.service";
import { AuthContext } from "../context/AuthContext";
import { useFriendship } from "./useFriendship";
import { usePageTitle } from "./usePageTitle";
import { notifySuccess, notifyError } from "../components/common/Notify";
import { useModal } from "../context/ModalContext";
import { useTranslation } from 'react-i18next';

export const useFriendsLogic = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useContext(AuthContext);
    const { addFriend, acceptRequest, removeFriend, blockUser, unblockUser } = useFriendship();
    const [searchParams, setSearchParams] = useSearchParams();
    const { openConfirm } = useModal();

    const tabs = [
        { id: 'my', label: t('common.friends') },
        { id: 'requests', label: t('friends.requests') },
        { id: 'subscriptions', label: t('friends.subscriptions') },
        { id: 'blocked', label: t('friends.blacklist') },
        { id: 'all', label: t('friends.global_search') },
    ];

    const activeTab = searchParams.get('tab') || 'my';
    usePageTitle(tabs.find(tab => tab.id === activeTab)?.label || t('common.friends'));

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const abortControllerRef = useRef(null);

    const fetchUsers = useCallback(async (tab, query) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);

        const res = await FriendService.getList(tab, query, controller.signal);

        if (!controller.signal.aborted) {
            if (res.success) {
                setUsers(res.data || []);
            } else {
                if (res.status === 404) {
                    setUsers([]);
                } else {
                    notifyError(res.message);
                }
            }
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setSearchQuery("");
        setUsers([]);
        fetchUsers(activeTab, "");
    }, [activeTab, fetchUsers]);

    const handleTabChange = (id) => setSearchParams({ tab: id });

    const handleSearchSubmit = () => {
        if (activeTab === 'all') {
            fetchUsers('all', searchQuery.trim().toLowerCase());
        }
    };

    const handleAction = async (action, username) => {
        if (action === 'delete' || action === 'block') {
            const confirmed = await openConfirm(t('common.are_u_sure'));
            if (!confirmed) return;
        }

        let res;

        if (action === 'add') res = await addFriend(username);
        else if (action === 'accept') res = await acceptRequest(username);
        else if (action === 'delete' || action === 'cancel_request') res = await removeFriend(username);
        else if (action === 'block') res = await blockUser(username);
        else if (action === 'unblock') res = await unblockUser(username);

        if (res?.success) {
            notifySuccess(res.message);

            if (activeTab !== 'all') {
                setUsers(prev => prev.filter(u => u.username !== username));
            } else {
                fetchUsers('all', searchQuery.toLowerCase());
            }
        } else {
            notifyError(res?.message || t('common.error'));
        }
    };

    return { tabs, activeTab, handleTabChange, searchQuery, setSearchQuery, handleSearchSubmit, users, loading, handleAction, currentUser, t };
};