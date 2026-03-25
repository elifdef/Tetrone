import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import StickerPackManager from './StickerPackManager';
import StickerPackModal from '../editor/StickerPackModal';

export default function MyPacksTab({ packs, onRefresh }) {
    const { t } = useTranslation();
    const [isCreating, setIsCreating] = useState(false);

    const [editingPackId, setEditingPackId] = useState(null);
    const [viewingPackId, setViewingPackId] = useState(null);

    const editingPack = packs.find(p => p.id === editingPackId);
    const viewingPack = packs.find(p => p.id === viewingPackId);

    const handlePackClick = (pack) => {
        if (pack.is_owner) {
            setEditingPackId(pack.id);
        } else {
            setViewingPackId(pack.id);
        }
    };

    return (
        <div className="tetrone-stickers-tab-content">
            <div className="tetrone-sticker-grid-scroll tetrone-packs-grid">

                <div
                    className="tetrone-grid-item tetrone-create-pack-card tetrone-pointer"
                    onClick={() => setIsCreating(true)}
                >
                    <div className="tetrone-create-pack-icon">+</div>
                    <div className="tetrone-create-pack-text">{t('stickers.create_new_pack')}</div>
                </div>

                {packs.map(pack => (
                    <div
                        key={pack.id}
                        className="tetrone-grid-item tetrone-pointer"
                        onClick={() => handlePackClick(pack)}
                    >
                        <img src={pack.cover_url} alt={pack.title} title={pack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                ))}
            </div>

            {isCreating && (
                <div className="tetrone-modal-overlay" onClick={() => setIsCreating(false)}>
                    <div className="tetrone-modal-content vk-style tetrone-modal-content-large" onClick={e => e.stopPropagation()}>
                        <div className="tetrone-modal-header vk-blue">
                            <h3>{t('stickers.create_pack')}</h3>
                            <button className="vk-close-btn" onClick={() => {
                                setIsCreating(false);
                                if (onRefresh) onRefresh();
                            }}>✖</button>
                        </div>
                        <div className="tetrone-pack-body" style={{ padding: '15px' }}>
                            <StickerPackManager
                                onSuccess={() => {
                                    setIsCreating(false);
                                    if (onRefresh) onRefresh();
                                }}
                                onCancel={() => setIsCreating(false)}
                                onRefresh={onRefresh}
                            />
                        </div>
                    </div>
                </div>
            )}

            {editingPackId && editingPack && (
                <div className="tetrone-modal-overlay" onClick={() => setEditingPackId(null)}>
                    <div className="tetrone-modal-content vk-style tetrone-modal-content-large" onClick={e => e.stopPropagation()}>
                        <div className="tetrone-modal-header vk-blue">
                            <h3>{t('stickers.edit_pack')}</h3>
                            <button className="vk-close-btn" onClick={() => {
                                setEditingPackId(null);
                                if (onRefresh) onRefresh();
                            }}>✖</button>
                        </div>
                        <div className="tetrone-pack-body" style={{ padding: '15px' }}>
                            <StickerPackManager
                                existingPack={editingPack}
                                onSuccess={() => {
                                    setEditingPackId(null);
                                    if (onRefresh) onRefresh();
                                }}
                                onCancel={() => setEditingPackId(null)}
                                onRefresh={onRefresh}
                            />
                        </div>
                    </div>
                </div>
            )}

            {viewingPackId && viewingPack && (
                <StickerPackModal
                    pack={viewingPack}
                    onClose={() => setViewingPackId(null)}
                    onRefresh={onRefresh}
                />
            )}
        </div>
    );
}