import api from "./axios";

class PostAPI {
    async post(data) {
        const res = await api.post("/posts", data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res;
    }

    async get(id) {
        const res = await api.get(`/posts/${id}`);
        return res;
    }

    async put(id, data) {
        const res = await api.post(`/posts/${id}`, data, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res;
    }

    async delete(id) {
        const res = await api.delete(`/posts/${id}`);
        return res;
    }

    async userPosts(username, pageNumber) {
        const res = await api.get(`/users/${username}/posts?page=${pageNumber}`)
        return res;
    }
}

export default new PostAPI();