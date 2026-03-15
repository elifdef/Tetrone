import fetchClient from '../api/client';

class ReportService {
    async getReasons() {
        const res = await fetchClient('/reports/reasons');
        return res.reasons || [];
    }

    async submitReport({ type, id, reason, details }) {  
        return await fetchClient('/reports', {
            method: 'POST',
            body: {
                type: type,
                id: String(id),
                reason: reason,
                details: details
            }
        });
    }
}

export default new ReportService();