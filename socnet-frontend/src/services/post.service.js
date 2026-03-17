import fetchClient from "../api/client";

class PostService {
    async create(data) {
        const formData = new FormData();

        if (data.content) formData.append('content', data.content);
        if (data.target_user_id) formData.append('target_user_id', data.target_user_id);
        if (data.original_post_id) formData.append('original_post_id', data.original_post_id);

        if (data.entities) {
            const entitiesStr = typeof data.entities === 'object'
                ? JSON.stringify(data.entities)
                : data.entities;
            formData.append('entities', entitiesStr);
        }

        if (data.images && data.images.length > 0) {
            data.images.forEach((file, index) => {
                formData.append(`media[${index}]`, file);
            });
        }

        return await fetchClient('/posts', {
            method: 'POST',
            body: formData
        });
    }

    async update(id, data) {
        const formData = new FormData();
        // Laravel очікує POST метод з _method=PUT для передачі файлів (FormData)
        formData.append('_method', 'PUT');

        if (data.content) formData.append('content', data.content);

        if (data.entities) {
            const entitiesStr = typeof data.entities === 'object'
                ? JSON.stringify(data.entities)
                : data.entities;
            formData.append('entities', entitiesStr);
        }

        if (data.images && data.images.length > 0) {
            data.images.forEach((file, index) => {
                formData.append(`media[${index}]`, file);
            });
        }

        if (data.deletedMedia && data.deletedMedia.length > 0) {
            data.deletedMedia.forEach((mediaId, index) => {
                formData.append(`deleted_media[${index}]`, mediaId);
            });
        }

        return await fetchClient(`/posts/${id}`, {
            method: 'POST',
            body: formData
        });
    }

    async get(id) {
        return await fetchClient(`/posts/${id}`);
    }

    async delete(id) {
        return await fetchClient(`/posts/${id}`, { method: 'DELETE' });
    }

    async toggleLike(postId) {
        return await fetchClient(`/posts/${postId}/like`, { method: 'POST' });
    }

    async getUserPosts(username, pageNumber = 1) {
        return await fetchClient(`/users/${username}/posts?page=${pageNumber}`);
    }

    async votePoll(postId, optionIds) {
        return await fetchClient(`/posts/${postId}/poll/vote`, {
            method: 'POST',
            body: { option_ids: optionIds }
        });
    }

    async getPollVoters(postId) {
        return await fetchClient(`/posts/${postId}/poll/voters`);
    }

    async closePoll(postId) {
        return await fetchClient(`/posts/${postId}/poll/close`, { method: 'POST' });
    }

    async getUserAvatars(username) {
        return await fetchClient(`/users/${username}/avatars`);
    }
}

export default new PostService();