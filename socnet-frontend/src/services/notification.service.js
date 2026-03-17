import fetchClient from "../api/client";

class NotificationSettingsService {
    async getSettings() {
        return await fetchClient('/settings/notifications');
    }

    async updateSettings(formData) {
        return await fetchClient('/settings/notifications', {
            method: 'POST',
            body: formData
        });
    }

    async getOverrides() {
        return await fetchClient('/settings/notifications/overrides');
    }

    async updateOverride(targetUserId, data) {
        return await fetchClient(`/settings/notifications/overrides/${targetUserId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async deleteOverride(targetUserId) {
        return await fetchClient(`/settings/notifications/overrides/${targetUserId}`, {
            method: 'DELETE'
        });
    }
}

export default new NotificationSettingsService();