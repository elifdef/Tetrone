import fetchClient from '../api/client';

class StatsService {
    async getLandingStats() {
        return await fetchClient('/stats/landing');
    }

    async getRecentUsers() {
        return await fetchClient('/stats/recent-users');
    }
}

export default new StatsService();