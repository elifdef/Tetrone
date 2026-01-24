import { useEffect, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useFriendship } from "../hooks/useFriendship";
import "../styles/Friends.css";

export default function FriendsPage() {
    const { user: currentUser } = useContext(AuthContext);
    const { addFriend, acceptRequest, removeFriend, blockUser, unblockUser } = useFriendship();

    const [activeTab, setActiveTab] = useState('my');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const abortControllerRef = useRef(null);

    const confirmAction = (message) => {
        return new Promise((resolve) => {
            toast((t) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{message}</span>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id); // ben not want talk to you
                            resolve(true); // hohoho, YES
                        }}
                        style={{ padding: '4px 8px', background: '#d33', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                    >
                        Так
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            resolve(false); //hohoho, NO
                        }}
                        style={{ padding: '4px 8px', background: '#555', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                    >
                        Ні
                    </button>
                </div>
            ), { duration: 5000, icon: '?' });
        });
    };

    const fetchUsers = async (query = "", signal) => {
        setLoading(true);
        try {
            let endpoint = '/friends';
            if (activeTab === 'requests') endpoint = '/friends/requests';
            else if (activeTab === 'blocked') endpoint = '/friends/blocked';
            else if (activeTab === 'all') endpoint = `/users?search=${query}`;

            const res = await api.get(endpoint, { signal });
            setUsers(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (err) {
            if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
                console.error("Помилка завантаження:", err);
            }
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    };

    useEffect(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const newController = new AbortController();
        abortControllerRef.current = newController;

        if (activeTab === 'all' && searchQuery) {
            const timeoutId = setTimeout(() => fetchUsers(searchQuery, newController.signal), 500);
            return () => clearTimeout(timeoutId);
        } else {
            fetchUsers(searchQuery, newController.signal);
        }
        return () => newController.abort();
    }, [activeTab, searchQuery]);

    const handleAction = async (action, username) => {
        if (action === 'delete' || action === 'block') {
            const message = action === 'block'
                ? `Заблокувати @${username}?`
                : `Видалити @${username}?`;

            const isConfirmed = await confirmAction(message);
            if (!isConfirmed) return;
        }

        const loadingToast = toast.loading('Обробка...');

        let result;
        switch (action) {
            case 'add': result = await addFriend(username); break;
            case 'accept': result = await acceptRequest(username); break;
            case 'delete':
            case 'cancel_request': result = await removeFriend(username); break;
            case 'block': result = await blockUser(username); break;
            case 'unblock': result = await unblockUser(username); break;
            default: toast.dismiss(loadingToast); return;
        }

        toast.dismiss(loadingToast);

        if (result.success) {
            toast.success(result.message);

            if (action !== 'add') {
                setUsers(prev => prev.filter(u => u.username !== username));
            }
        } else {
            toast.error(result.message);
        }
    };

    const filteredUsers = users.filter(u => {
        if (activeTab === 'all') return true;
        if (u.id === currentUser?.id) return false;
        const search = searchQuery.toLowerCase();
        return (u.first_name + " " + u.last_name).toLowerCase().includes(search) ||
            u.username.toLowerCase().includes(search);
    });
    return (
        <div className="friends-container">
            <h2 style={{ marginBottom: 20 }}>Контакти</h2>

            <div className="tabs-header">
                {['my', 'requests', 'all', 'blocked'].map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'my' && 'Друзі'}
                        {tab === 'requests' && 'Заявки'}
                        {tab === 'all' && 'Пошук'}
                        {tab === 'blocked' && 'Чорний список'}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: 15 }}>
                <input
                    type="text"
                    placeholder="Швидкий пошук..."
                    className="input-field"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {loading && users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20 }}>Завантаження...</div>
            ) : (
                <div className="users-list">
                    {filteredUsers.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>Список порожній</div>
                    )}

                    {filteredUsers.map(u => (
                        <div key={u.id} className="user-row">
                            <Link to={`/${u.username}`}>
                                <img src={u.avatar || "/defaultAvatar.jpg"} alt={u.username} className="user-row-avatar" />
                            </Link>

                            <div className="user-row-info">
                                <Link to={`/${u.username}`} className="user-row-name">
                                    {u.first_name} {u.last_name}
                                </Link>
                                <div className="user-row-bio">@{u.username}</div>
                            </div>

                            <div className="user-row-actions">
                                {activeTab === 'my' && (
                                    <>
                                        <button className="btn-small btn-remove" onClick={() => handleAction('delete', u.username)}>Видалити</button>
                                        <button className="btn-small btn-remove" onClick={() => handleAction('block', u.username)}>Block</button>
                                    </>
                                )}

                                {activeTab === 'requests' && (
                                    <>
                                        <button className="btn-small btn-add" onClick={() => handleAction('accept', u.username)}>Прийняти</button>
                                        <button className="btn-small btn-remove" onClick={() => handleAction('cancel_request', u.username)}>Відхилити</button>
                                    </>
                                )}

                                {activeTab === 'all' && (
                                    <button className="btn-small btn-add" onClick={() => handleAction('add', u.username)}>Додати</button>
                                )}

                                {activeTab === 'blocked' && (
                                    <button className="btn-small btn-add" onClick={() => handleAction('unblock', u.username)}>Розблокувати</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}