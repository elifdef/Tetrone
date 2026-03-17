import fetchClient from "../api/client";

class AdminService {
    async getUsers(search = '', page = 1) {
        return await fetchClient(`/admin/users?search=${search}&page=${page}`);
    }

    async getUserDossier(username) {
        return await fetchClient(`/admin/users/${username}`);
    }

    async toggleMute(username, reason) {
        return await fetchClient(`/admin/users/${username}/mute`, { method: 'POST', body: { reason } });
    }

    async toggleBan(username, reason) {
        return await fetchClient(`/admin/users/${username}/ban`, { method: 'POST', body: { reason } });
    }

    async getPosts(username = '', page = 1) {
        return await fetchClient(`/admin/posts?username=${username}&page=${page}`);
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
}

export default new AdminService();