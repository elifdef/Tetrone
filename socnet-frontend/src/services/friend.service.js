import fetchClient from "../api/client";

class FriendService {
    async getList(tab, query = '', signal = null) {
        let endpoint = '/friends';

        switch (tab) {
            case 'requests': endpoint = '/friends/requests'; break;
            case 'subscriptions': endpoint = '/friends/sent'; break;
            case 'blocked': endpoint = '/friends/blocked'; break;
            case 'all': endpoint = `/users?search=${query}`; break;
            default: endpoint = '/friends'; break;
        }

        return await fetchClient(endpoint, { signal });
    }

    async addFriend(username) {
        return await fetchClient(`/friends/add/${username}`, { method: 'POST' });
    }

    async acceptRequest(username) {
        return await fetchClient(`/friends/accept/${username}`, { method: 'POST' });
    }

    async removeFriend(username) {
        return await fetchClient(`/friends/${username}`, { method: 'DELETE' });
    }

    async blockUser(username) {
        return await fetchClient(`/friends/block/${username}`, { method: 'POST' });
    }

    async unblockUser(username) {
        return await fetchClient(`/friends/blocked/${username}`, { method: 'DELETE' });
    }
}

export default new FriendService();