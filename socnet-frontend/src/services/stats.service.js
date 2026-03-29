import fetchClient from '../api/client';

class StatsService {
    async getLandingStats() {
        return await fetchClient('/stats/landing');
    }
}

export default new StatsService();