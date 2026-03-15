import fetchClient from "../api/client";

class CommentService {
    async getComments(postId, page = 1) {
        const res = await fetchClient(`/posts/${postId}/comments?page=${page}`);
        return {
            items: res.data || [],
            meta: res.meta || null
        };
    }

    async addComment(postId, content) {
        return await fetchClient(`/posts/${postId}/comments`, {
            method: 'POST',
            body: { content }
        });
    }

    async delete(commentId) {
        return await fetchClient(`/comments/${commentId}`, {
            method: 'DELETE'
        });
    }
}

export default new CommentService();