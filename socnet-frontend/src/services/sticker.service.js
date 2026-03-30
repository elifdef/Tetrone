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

    async updatePack(shortName, data) {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.title) formData.append('title', data.title);
        if (data.is_published !== undefined) formData.append('is_published', data.is_published ? '1' : '0');
        if (data.cover) formData.append('cover', data.cover);

        return await fetchClient(`/stickers/packs/${shortName}`, {
            method: 'POST',
            body: formData
        });
    }

    async deletePack(shortName) {
        return await fetchClient(`/stickers/packs/${shortName}`, { method: 'DELETE' });
    }

    async installPack(shortName) {
        return await fetchClient(`/stickers/packs/${shortName}/install`, { method: 'POST' });
    }

    async uninstallPack(shortName) {
        return await fetchClient(`/stickers/packs/${shortName}/uninstall`, { method: 'DELETE' });
    }

    async reorderPacks(packShortNames) {
        return await fetchClient('/stickers/reorder-packs', {
            method: 'PUT',
            body: { packShortNames }
        });
    }

    async search(query) {
        return await fetchClient(`/stickers/search?q=${query}`);
    }

    async addSticker(shortName, data) {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('shortcode', data.shortcode);
        if (data.keywords) formData.append('keywords', data.keywords);

        return await fetchClient(`/stickers/packs/${shortName}/items`, {
            method: 'POST',
            body: formData
        });
    }

    async updateSticker(id, data) {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (data.file) formData.append('file', data.file);
        if (data.shortcode) formData.append('shortcode', data.shortcode);
        if (data.keywords) formData.append('keywords', data.keywords);

        return await fetchClient(`/stickers/${id}`, {
            method: 'POST',
            body: formData
        });
    }

    async deleteSticker(id) {
        return await fetchClient(`/stickers/${id}`, { method: 'DELETE' });
    }

    async reorderStickers(shortName, items) {
        return await fetchClient(`/stickers/packs/${shortName}/reorder`, {
            method: 'PUT',
            body: { items }
        });
    }

    async getStickerInfo(shortcode) {
        return await fetchClient(`/stickers/${shortcode}/info`);
    }

    async reportPack(shortName, reason) {
        return await fetchClient(`/stickers/packs/${shortName}/report`, {
            method: 'POST',
            body: { reason }
        });
    }
}

export default new StickerService();