import fetchClient from '../api/client';

class AuthService {
    async signUp(formData) {
        return await fetchClient('/sign-up', {
            method: 'POST',
            body: formData
        });
    }

    async signIn(email, password) {
        return await fetchClient('/sign-in', {
            method: 'POST',
            body: { email, password }
        });
    }

    async getMe(token = null) {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetchClient('/me', { headers });
        return res.data || res;
    }

    async verifyEmail(id, hash, query) {
        return await fetchClient(`/email/verify/${id}/${hash}?${query}`);
    }

    async resendVerification() {
        return await fetchClient('/email/verification-notification', {
            method: 'POST'
        });
    }
}

export default new AuthService();