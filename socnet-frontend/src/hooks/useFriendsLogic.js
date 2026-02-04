import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useFriendship } from "../hooks/useFriendship";
import { usePageTitle } from "../hooks/usePageTitle";
import { notifySuccess, notifyError, notifyConfirmAction } from '../components/Notify';
import { mapUser } from "../services/mappers";

export const useFriendsLogic = () => {
    const { user: currentUser } = useContext(AuthContext);
    const { addFriend, acceptRequest, removeFriend, blockUser, unblockUser } = useFriendship();
    const [searchParams, setSearchParams] = useSearchParams();

    const tabs = [
        { id: 'my', label: 'Друзі' },
        { id: 'requests', label: 'Заявки' },
        { id: 'subscriptions', label: 'Підписки' },
        { id: 'blocked', label: 'Чорний список' },
        { id: 'all', label: 'Глобальний пошук' },
    ];

    const activeTab = searchParams.get('tab') || 'my';
    usePageTitle(tabs.find(t => t.id === activeTab)?.label || 'Друзі');

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // useRef для збереження контролера щоб скасовувати запити
    const abortControllerRef = useRef(null);

    const fetchUsers = useCallback(async (tab, query) => {
        // скасування попереднього запиту
        if (abortControllerRef.current)
            abortControllerRef.current.abort();

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);

        try {
            let endpoint = '/friends';
            switch (tab) {
                case 'requests': endpoint = '/friends/requests'; break;
                case 'subscriptions': endpoint = '/friends/sent'; break;
                case 'blocked': endpoint = '/friends/blocked'; break;
                case 'all': endpoint = `/users?search=${query}`; break;
                case 'my': default: endpoint = '/friends'; break;
            }

            const res = await api.get(endpoint, { signal: controller.signal });
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setUsers(data.map(mapUser));

        } catch (err) {
            if (err.name !== "CanceledError") {
                if (err.response?.status === 404) setUsers([]);
                else notifyError("Помилка завантаження");
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        setSearchQuery("");
        setUsers([]);

        activeTab === 'all'
            ? setLoading(false)
            : fetchUsers(activeTab, "");

    }, [activeTab, fetchUsers]);

    const handleTabChange = (id) => setSearchParams({ tab: id });

    const handleSearchSubmit = () => {
        if (activeTab === 'all' && searchQuery.trim())
            fetchUsers('all', searchQuery.toLowerCase());
    };

    const handleAction = async (action, username) => {
        if (action === 'delete' || action === 'block') {
            if (!(await notifyConfirmAction(`Ви впевнені?`))) return;
        }

        try {
            let res;
            if (action === 'add')
                res = await addFriend(username);

            else if (action === 'accept')
                res = await acceptRequest(username);

            else if (action === 'delete' || action === 'cancel_request')
                res = await removeFriend(username);

            else if (action === 'block')
                res = await blockUser(username);
            else if (action === 'unblock')
                res = await unblockUser(username);

            if (res?.success) {
                notifySuccess(res.message);
                activeTab !== 'all'
                    ? setUsers(prev => prev.filter(u => u.username !== username))
                    : fetchUsers('all', searchQuery.toLowerCase());
            }
        } catch (e) {
            notifyError("Помилка");
        }
    };

    return {
        tabs, activeTab, handleTabChange,
        searchQuery, setSearchQuery, handleSearchSubmit,
        users, loading,
        handleAction, currentUser
    };
};