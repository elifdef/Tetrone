import fetchClient from '../api/client';

class AppealService {
    async checkStatus() {
        return await fetchClient('/appeals/status');
    }

    async submitAppeal(message) {
        return await fetchClient('/appeals', { method: 'POST', body: { message } });
    }
}

export default new AppealService();