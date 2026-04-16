import fetchClient from "../api/client";

class AdminService {
    async getUsers(search = '', page = 1) {
        return await fetchClient(`/admin/users?search=${search}&page=${page}`);
    }

    async getUser(username) {
        return await fetchClient(`/admin/users/${username}`);
    }

    async toggleMute(username, reason) {
        return await fetchClient(`/admin/users/${username}/mute`, { method: 'POST', body: { reason } });
    }

    async toggleBan(username, reason) {
        return await fetchClient(`/admin/users/${username}/ban`, { method: 'POST', body: { reason } });
    }

    async getDashboardStats() {
        return await fetchClient('/admin/dashboard');
    }

    async getReports(status = 'pending') {
        return await fetchClient(`/admin/reports?status=${status}`);
    }

    async handleReport(reportId, actionType, adminResponse) {
        return await fetchClient(`/admin/reports/${reportId}/${actionType}`, { method: 'POST', body: { admin_response: adminResponse } });
    }

    async getAppeals(status = 'pending') {
        return await fetchClient(`/admin/appeals?status=${status}`);
    }

    async handleAppeal(appealId, actionType, adminResponse) {
        return await fetchClient(`/admin/appeals/${appealId}/${actionType}`, { method: 'POST', body: { admin_response: adminResponse } });
    }

    async getUserPosts(username, page = 1) {
        return await fetchClient(`/admin/users/${username}/posts?page=${page}`);
    }

    async getUserComments(username, page = 1) {
        return await fetchClient(`/admin/users/${username}/comments?page=${page}`);
    }

    async getUserLikes(username, page = 1) {
        return await fetchClient(`/admin/users/${username}/likes?page=${page}`);
    }
    
    async getUserSessions(username) {
        return await fetchClient(`/admin/users/${username}/sessions`);
    }

    async getTickets(status = '') {
        const query = status ? `?status=${status}` : '';
        return await fetchClient(`/admin/tickets${query}`);
    }

    async getTicket(id) {
        return await fetchClient(`/admin/tickets/${id}`);
    }

    async replyToTicket(id, message, isInternal) {
        return await fetchClient(`/admin/tickets/${id}/reply`, {
            method: 'POST',
            body: { message, is_internal: isInternal }
        });
    }

    async assignTicket(id) {
        return await fetchClient(`/admin/tickets/${id}/assign`, {
            method: 'POST'
        });
    }
}

export default new AdminService();