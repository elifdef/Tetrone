import { useTranslation } from 'react-i18next';
import { useGender } from './useGender';

export const useNotificationText = () => {
    const { t } = useTranslation();
    const { getGenderMap } = useGender(null);
    const genderTextMap = getGenderMap(t);

    const getNotificationData = (typeKey, data) => {
        if (!data) return { actionText: '', linkText: null, linkUrl: null };

        const genderId = data.user_gender || 1;
        const phrase = genderTextMap[genderId];

        let key = typeKey || '';

        if (key.includes('NewLike')) key = 'new_like';
        if (key.includes('NewComment')) key = 'new_comment';
        if (key.includes('NewFriendRequest')) key = 'new_friend_request';
        if (key.includes('NewWallPost') || key === 'wall_post') key = 'wall_post';
        if (key.includes('NewRepost') || key === 'repost') key = 'repost';
        if (key.includes('ReportReviewed') || key === 'report_reviewed') key = 'report_reviewed';
        if (key.includes('NewMessage') || key === 'new_message') key = 'new_message';

        const payload = data.data || data;
        const linkUrl = data.post_id ? `/post/${data.post_id}` : null;

        switch (key) {
            case 'new_like':
                return {
                    actionText: phrase.liked,
                    linkText: t('notifications.your_post'),
                    linkUrl
                };

            case 'new_comment':
                return {
                    actionText: phrase.commented,
                    linkText: t('notifications.your_post'),
                    linkUrl
                };

            case 'new_friend_request':
                return {
                    actionText: t('notifications.friend_request'),
                    linkText: null,
                    linkUrl: null
                };

            case 'wall_post':
                return {
                    actionText: '',
                    linkText: phrase.wall_post, // "залишив(-ла) запис на вашій стіні."
                    linkUrl
                };

            case 'repost':
                return {
                    actionText: '',
                    linkText: phrase.repost, // "поділився(-лась) вашим записом."
                    linkUrl
                };

            case 'report_reviewed':
                return {
                    actionText: t('notifications.report_reviewed_click'),
                    linkText: '',
                    linkUrl: null
                };

            case 'new_message': {
                let snippet = payload.message_text;

                if (!snippet && payload.file_type) {
                    if (payload.file_type === 'image') snippet = phrase.sent_image;
                    else if (payload.file_type === 'video') snippet = phrase.sent_video;
                    else snippet = phrase.sent_file;
                }

                payload.post_snippet = snippet;

                return {
                    actionText: phrase.wrote,
                    linkText: null,
                    linkUrl: `/messages?dm=${payload.chat_slug}`
                };
            }

            default:
                return { actionText: '', linkText: null, linkUrl: null };
        }
    };

    return { getNotificationData };
};