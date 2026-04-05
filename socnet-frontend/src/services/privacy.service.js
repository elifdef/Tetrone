import fetchClient from '../api/client';

const PrivacyService = {
    getSettings: async () => {
        return await fetchClient('/settings/privacy');
    },

    updateSetting: async (context, level) => {
        return await fetchClient('/settings/privacy', { 
            method: 'PATCH',
            body: { context, level } 
        });
    },

    setException: async (targetUserId, context, isAllowed) => {
        return await fetchClient('/settings/privacy/exceptions', {
            method: 'POST',
            body: {
                target_user_id: targetUserId,
                context,
                is_allowed: isAllowed
            }
        });
    },

    deleteException: async (exceptionId) => {
        return await fetchClient(`/settings/privacy/exceptions/${exceptionId}`, {
            method: 'DELETE'
        });
    }
};

export default PrivacyService;