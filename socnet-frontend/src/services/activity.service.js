import fetchClient from "../api/client";

class ActivityService {
    async getLikedPosts(page = 1) {
        const res = await fetchClient(`/activity/liked?page=${page}`);

        return {
            items: res.data || [],
            meta: res.meta || null
        };
    }

    async getMyComments(page = 1) {
        const res = await fetchClient(`/activity/comments?page=${page}`);
        return {
            items: res.data || [],
            meta: res.meta || null
        };
    }
}

export default new ActivityService();