import FormInput from "../components/UI/FormInput";
import FriendCard from "../components/friends/FriendCard";
import { useFriendsLogic } from "../hooks/useFriendsLogic";

export default function FriendsPage() {
    const {
        tabs, activeTab, handleTabChange,
        searchQuery, setSearchQuery, handleSearchSubmit,
        users, loading, handleAction
    } = useFriendsLogic();

    const displayUsers = activeTab === 'all'
        ? users
        : users.filter(u =>
            (u.first_name + " " + u.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="vk-friends-page">
            <h1 className="vk-friends-title">Ваші контакти</h1>
            <div className="vk-friends-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`vk-friends-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="vk-friends-search-wrapper">
                <FormInput
                    placeholder={activeTab === 'all' ? "Пошук людей..." : "Фільтр списку..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && activeTab === 'all' && handleSearchSubmit()}
                    className="vk-friends-search-input"
                />
                {activeTab === 'all' && (
                    <button className="vk-friends-search-btn" onClick={handleSearchSubmit}>
                        Знайти
                    </button>
                )}
            </div>

            <div className="vk-friends-list">
                {loading && <div className="vk-friends-loading">Завантаження...</div>}

                {!loading && displayUsers.length === 0 && (
                    <div className="vk-friends-empty">
                        {activeTab === 'all' ? "Введіть запит для пошуку" : "Список порожній"}
                    </div>
                )}

                {displayUsers.map(user => (
                    <FriendCard
                        key={user.id}
                        user={user}
                        viewMode={activeTab}
                        onAction={handleAction}
                    />
                ))}
            </div>
        </div>
    );
}