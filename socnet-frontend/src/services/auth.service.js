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
        return await fetchClient('/me', { headers });
    }

    async verifyEmail(id, hash, query) {
        return await fetchClient(`/email/verify/${id}/${hash}?${query}`);
    }

    async resendVerification() {
        return await fetchClient('/email/verification-notification', {
            method: 'POST'
        });
    }

    async getSessions() {
        return await fetchClient('/settings/sessions');
    }

    async revokeSession(tokenId) {
        return await fetchClient(`/settings/sessions/${tokenId}`, { method: 'DELETE' });
    }
    
    async revokeAllOtherSessions() {
        return await fetchClient('/settings/sessions', { method: 'DELETE' });
    }
}

export default new AuthService();