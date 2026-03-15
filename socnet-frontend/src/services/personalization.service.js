import fetchClient from "../api/client";

class PersonalizationService {
    async getSettings() {
        const data = await fetchClient('/settings/personalization');
        return data.personalization || data;
    }

    async updateSettings(formData) {
        return await fetchClient('/settings/personalization', { 
            method: 'POST', 
            body: formData 
        });
    }
}

export default new PersonalizationService();