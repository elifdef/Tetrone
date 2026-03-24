import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError } from "../../common/Notify";
import { usePostMedia } from "./usePostMedia";
import { usePostForm } from "./usePostForm";
import { isEditorEmpty } from "../../../utils/editorHelpers";

export const useEditPost = (post, saveEdit) => {
    const { t } = useTranslation();

    const [editContent, setEditContent] = useState(post.content || '');
    const [existingMedia, setExistingMedia] = useState(post.attachments || []);
    const [deletedMediaIds, setDeletedMediaIds] = useState([]);
    const [removedPreviews, setRemovedPreviews] = useState([]);

    useEffect(() => {
        if (post?.entities?.removed_previews) {
            setRemovedPreviews(post.entities.removed_previews);
        }
    }, [post]);

    const { external } = usePostMedia(editContent, [], { removed_previews: removedPreviews });

    const formTools = usePostForm(existingMedia.length);

    const removeExistingMedia = (mediaId) => {
        setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
        setDeletedMediaIds(prev => [...prev, mediaId]);
    };

    const toggleYouTubePreview = (videoId) => {
        setRemovedPreviews(prev =>
            prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
        );
    };

    const handleSave = () => {
        const emptyEditor = isEditorEmpty(editContent);
        const hasPoll = !!post?.entities?.poll;

        if (emptyEditor && existingMedia.length === 0 && formTools.files.length === 0 && !hasPoll) {
            notifyError(t('post.empty_post'));
            return;
        }

        const entities = {
            ...(post.entities || {}),
            removed_previews: removedPreviews
        };

        const finalContent = emptyEditor ? null : editContent;

        saveEdit(post.id, {
            content: finalContent,
            images: formTools.files,
            deletedMedia: deletedMediaIds,
            entities
        });
    };

    return {
        editContent, setEditContent,
        existingMedia, removeExistingMedia,
        removedPreviews, toggleYouTubePreview,
        external,
        handleSave,
        ...formTools
    };
};