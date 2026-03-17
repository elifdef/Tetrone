import fetchClient from "../api/client";

class PersonalizationService {
    async getSettings() {
        return await fetchClient('/settings/personalization');
    }

    async updateSettings(formData) {
        return await fetchClient('/settings/personalization', { method: 'POST', body: formData });
    }
}

export default new PersonalizationService();