import fetchClient from '../api/client';

class FeedService {
    async getFeed(type = 'feed', page = 1, signal = null) {
        const endpoint = type === 'global' ? '/feed/global' : '/feed';
        return await fetchClient(`${endpoint}?page=${page}`, { signal });
    }
}

export default new FeedService();