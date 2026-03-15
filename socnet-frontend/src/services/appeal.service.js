import fetchClient from '../api/client';

class AppealService {
    async checkStatus() {
        const res = await fetchClient('/appeals/status');
        return res;
    }

    async submitAppeal(message) {
        return await fetchClient('/appeals', {
            method: 'POST',
            body: { message }
        });
    }
}

export default new AppealService();