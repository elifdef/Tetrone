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
        if (post?.youtube_settings?.removed_previews) {
            setRemovedPreviews(post.youtube_settings.removed_previews);
        }
    }, [post]);

    const { external } = usePostMedia(editContent, [], { removed_previews: removedPreviews });
    const formTools = usePostForm(existingMedia.length);

    const removeExistingMedia = (mediaId) => {
        setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
        setDeletedMediaIds(prev => [...prev, mediaId]);
    };

    const toggleYouTubePreview = (videoId) => {
        setRemovedPreviews(prev => prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]);
    };

    const handleSave = () => {
        const emptyEditor = isEditorEmpty(editContent);
        const hasPoll = !!post?.poll;

        if (emptyEditor && existingMedia.length === 0 && formTools.files.length === 0 && !hasPoll) {
            notifyError(t('post.empty_post'));
            return;
        }

        const payload = {};
        payload.text = emptyEditor ? null : editContent;
        if (removedPreviews.length > 0) payload.youtube = { removed_previews: removedPreviews };

        saveEdit(post.id, {
            payload,
            images: formTools.files,
            deletedMedia: deletedMediaIds
        });
    };

    return {
        editContent, setEditContent, existingMedia, removeExistingMedia,
        removedPreviews, toggleYouTubePreview, external, handleSave, ...formTools
    };
};