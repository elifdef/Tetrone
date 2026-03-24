import fetchClient from '../api/client';

class StickerService {
    async getCatalog(page = 1) {
        return await fetchClient(`/stickers/catalog?page=${page}`);
    }

    async getMyPacks() {
        return await fetchClient('/stickers/my');
    }

    async createPack(data) {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('is_published', data.is_published ? '1' : '0');
        if (data.cover) formData.append('cover', data.cover);

        return await fetchClient('/stickers/packs', {
            method: 'POST',
            body: formData
        });
    }

    async updatePack(id, data) {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.title) formData.append('title', data.title);
        if (data.is_published !== undefined) formData.append('is_published', data.is_published ? '1' : '0');
        if (data.cover) formData.append('cover', data.cover);

        return await fetchClient(`/stickers/packs/${id}`, {
            method: 'POST',
            body: formData
        });
    }

    async deletePack(id) {
        return await fetchClient(`/stickers/packs/${id}`, { method: 'DELETE' });
    }

    async installPack(id) {
        return await fetchClient(`/stickers/packs/${id}/install`, { method: 'POST' });
    }

    async uninstallPack(id) {
        return await fetchClient(`/stickers/packs/${id}/uninstall`, { method: 'DELETE' });
    }

    async reorderPacks(packIds) {
        return await fetchClient('/stickers/reorder-packs', {
            method: 'PUT',
            body: { packIds }
        });
    }

    async search(query) {
        return await fetchClient(`/stickers/search?q=${query}`);
    }

    async addSticker(packId, data) {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('shortcode', data.shortcode);
        if (data.keywords) formData.append('keywords', data.keywords);

        return await fetchClient(`/stickers/packs/${packId}/items`, {
            method: 'POST',
            body: formData
        });
    }

    async deleteSticker(id) {
        return await fetchClient(`/stickers/${id}`, { method: 'DELETE' });
    }

    async reorderStickers(packId, items) {
        return await fetchClient(`/stickers/packs/${packId}/reorder`, {
            method: 'PUT',
            body: { items }
        });
    }

    async getStickerInfo(emojiId) {
        return await fetchClient(`/stickers/${emojiId}/info`);
    }

    async reportPack(packId, reason) {
        return await fetchClient(`/stickers/packs/${packId}/report`, {
            method: 'POST',
            body: { reason }
        });
    }
}

export default new StickerService();