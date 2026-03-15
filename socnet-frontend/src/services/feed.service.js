import fetchClient from '../api/client';

class FeedService {
    async getFeed(type = 'feed', page = 1, signal = null) {
        const endpoint = type === 'global' ? '/feed/global' : '/feed';
        
        const data = await fetchClient(`${endpoint}?page=${page}`, { 
            signal 
        });

        return {
            items: data.data || [],
            meta: data.meta || null
        };
    }
}

export default new FeedService();