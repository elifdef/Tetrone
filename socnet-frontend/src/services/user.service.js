import fetchClient from "../api/client";

class UserService {
    async getProfile(username) {
        return await fetchClient(`/users/${username}`);
    }

    async updateProfile(username, data) {
        return await fetchClient(`/users/${username}`, {
            method: 'POST',
            body: data
        });
    }

    async updateEmail(email, password) {
        return await fetchClient('/user/email', {
            method: 'PUT',
            body: { email, password }
        });
    }

    async updatePassword(current_password, password, password_confirmation) {
        return await fetchClient('/user/password', {
            method: 'PUT',
            body: { current_password, password, password_confirmation }
        });
    }

    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await fetchClient(`/users?${queryString}`);
    }
}

export default new UserService();