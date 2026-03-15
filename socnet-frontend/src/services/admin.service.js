import fetchClient from "../api/client";

class AdminService {
    async getUsers(search = '', page = 1) {
        const res = await fetchClient(`/admin/users?search=${search}&page=${page}`);
        return {
            items: res.data || [],
            meta: res.meta || null
        };
    }

    async getUserDossier(username) {
        const data = await fetchClient(`/admin/users/${username}`);
        return data.data || data;
    }

    async toggleMute(username, reason) {
        return await fetchClient(`/admin/users/${username}/mute`, {
            method: 'POST',
            body: { reason }
        });
    }

    async toggleBan(username, reason) {
        return await fetchClient(`/admin/users/${username}/ban`, {
            method: 'POST',
            body: { reason }
        });
    }

    async getPosts(username = '', page = 1) {
        const res = await fetchClient(`/admin/posts?username=${username}&page=${page}`);
        return {
            items: res.data || [],
            meta: res.meta || null
        };
    }

    async getDashboardStats() {
        return await fetchClient('/admin/dashboard');
    }

    async getReports(status = 'pending') {
        const res = await fetchClient(`/admin/reports?status=${status}`);
        return {
            reports: res.reports?.data || [],
            stats: res.stats || { total: 0, pending: 0, resolved: 0, rejected: 0 }
        };
    }

    async handleReport(reportId, actionType, adminResponse) {
        return await fetchClient(`/admin/reports/${reportId}/${actionType}`, {
            method: 'POST',
            body: { admin_response: adminResponse }
        });
    }

    async getAppeals(status = 'pending') {
        const res = await fetchClient(`/admin/appeals?status=${status}`);
        return {
            items: res.appeals?.data || [],
            stats: res.stats || { total: 0, pending: 0, approved: 0, rejected: 0 }
        };
    }

    async handleAppeal(appealId, actionType, adminResponse) {
        return await fetchClient(`/admin/appeals/${appealId}/${actionType}`, {
            method: 'POST',
            body: { admin_response: adminResponse }
        });
    }
}

export default new AdminService();