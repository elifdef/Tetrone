import api from './axios';

export const reportAPI = {
    getReasons: async () => {
        const response = await api.get('/reports/reasons');
        return response.data.reasons;
    },

    submitReport: async ({ type, id, reason, details }) => {  
        const response = await api.post('/reports', {
            type: type,
            id: String(id),
            reason: reason,
            details: details
        });
        return response.data;
    }
};