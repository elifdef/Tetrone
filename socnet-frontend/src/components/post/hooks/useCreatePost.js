import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notifyError } from "../../common/Notify";
import { usePostMedia } from "./usePostMedia";
import { usePostForm } from "./usePostForm";
import { isEditorEmpty } from "../../../utils/editorHelpers";

export const useCreatePost = (onSubmitSuccess) => {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [removedPreviews, setRemovedPreviews] = useState([]);
    const [pollData, setPollData] = useState(null);
    const [showPollCreator, setShowPollCreator] = useState(false);

    const { external } = usePostMedia(content, [], { removed_previews: removedPreviews });

    const formTools = usePostForm(0);

    const toggleYouTubePreview = (videoId) => {
        setRemovedPreviews(prev =>
            prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
        );
    };

    const handleSubmit = async () => {
        const emptyEditor = isEditorEmpty(content);

        if (emptyEditor && formTools.files.length === 0 && !pollData) {
            notifyError(t('post.empty_post'));
            return;
        }

        const entities = { removed_previews: removedPreviews };
        if (pollData) entities.poll = pollData;

        const finalContent = emptyEditor ? null : content;

        const success = await onSubmitSuccess(finalContent, formTools.files, entities);

        if (success) {
            setContent('');
            setRemovedPreviews([]);
            setPollData(null);
            formTools.clearFiles();
        }
    };

    return {
        content, setContent,
        pollData, setPollData,
        showPollCreator, setShowPollCreator,
        removedPreviews, toggleYouTubePreview,
        external,
        handleSubmit,
        ...formTools
    };
};