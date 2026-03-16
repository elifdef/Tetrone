import fetchClient from '../api/client';

class ChatService {
    async getChats() {
        const res = await fetchClient('/chat');
        return res.data || res;
    }

    async initChat(targetUserId) {
        return await fetchClient('/chat/init', {
            method: 'POST',
            body: { target_user_id: targetUserId }
        });
    }

    async getMessages(slug, page = 1) {
        const res = await fetchClient(`/chat/${slug}/messages?page=${page}`);
        return {
            items: res.data || [],
            meta: res.meta || null
        };
    }

    async sendMessage(slug, text, files = [], sharedPostId = null, replyToId = null) {
        const formData = new FormData();
        if (text) formData.append('text', text);
        if (sharedPostId) formData.append('shared_post_id', sharedPostId);
        if (replyToId) formData.append('reply_to_id', replyToId);
        files.forEach(file => formData.append('media[]', file));

        return await fetchClient(`/chat/${slug}/message`, {
            method: 'POST',
            body: formData
        });
    }

    async updateMessage(slug, messageId, text, newFiles = [], deletedMedia = []) {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (text) formData.append('text', text);
        newFiles.forEach(file => formData.append('media[]', file));
        deletedMedia.forEach(fileName => formData.append('deleted_media[]', fileName));

        return await fetchClient(`/chat/${slug}/message/${messageId}/update`, {
            method: 'POST',
            body: formData
        });
    }

    async deleteMessage(slug, messageId) {
        return await fetchClient(`/chat/${slug}/message/${messageId}`, {
            method: 'DELETE'
        });
    }

    async deleteChat(slug, forBoth) {
        return await fetchClient(`/chat/${slug}`, {
            method: 'DELETE',
            body: { for_both: forBoth }
        });
    }

    async togglePin(slug, messageId) {
        return await fetchClient(`/chat/${slug}/message/${messageId}/pin`, {
            method: 'POST'
        });
    }

    async markAsRead(slug) {
        return await fetchClient(`/chat/${slug}/read`, {
            method: 'POST'
        });
    }
}

export default new ChatService();