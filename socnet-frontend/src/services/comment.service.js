import fetchClient from "../api/client";

class CommentService {
    async getComments(postId, page = 1) {
        return await fetchClient(`/posts/${postId}/comments?page=${page}`);
    }

    async addComment(postId, content) {
        return await fetchClient(`/posts/${postId}/comments`, { method: 'POST', body: { content } });
    }

    async update(commentId, content) {
        return await fetchClient(`/comments/${commentId}`, { method: 'PUT', body: { content } });
    }

    async delete(commentId) {
        return await fetchClient(`/comments/${commentId}`, { method: 'DELETE' });
    }
}

export default new CommentService();