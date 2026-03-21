import fetchClient from "../api/client";

class CommentService {
    async getComments(postId, page = 1) {
        return await fetchClient(`/posts/${postId}/comments?page=${page}`);
    }
    async addComment(postId, content) {
        return await fetchClient(`/posts/${postId}/comments`, { method: 'POST', body: { content } });
    }
    
    async update(commentUid, content) {
        return await fetchClient(`/comments/${commentUid}`, { method: 'PUT', body: { content } });
    }

    async delete(commentUid) {
        return await fetchClient(`/comments/${commentUid}`, { method: 'DELETE' });
    }
}

export default new CommentService();