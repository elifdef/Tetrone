import { useCallback } from "react";
import { useTranslation } from 'react-i18next';
import FriendService from "../services/friend.service";

export const useFriendship = () => {
    const { t } = useTranslation();

    const addFriend = useCallback(async (username) => {
        try {
            await FriendService.addFriend(username);
            return { success: true, message: t('friends.request_sent') };
        } catch (err) {
            if (err.status === 403) {
                return { success: false, message: t('error.email_not_confirm') };
            }
            return { success: false, message: err.data?.message || t('common.error') };
        }
    }, [t]);

    const acceptRequest = useCallback(async (username) => {
        try {
            await FriendService.acceptRequest(username);
            return { success: true, message: t('friends.accept_request') };
        } catch (err) {
            if (err.status === 403) {
                return { success: false, message: t('error.email_not_confirm') };
            }
            return { success: false, message: err.data?.message || t('common.error') };
        }
    }, [t]);

    const removeFriend = useCallback(async (username) => {
        try {
            await FriendService.removeFriend(username);
            return { success: true, message: t('friends.removed_from_friends') };
        } catch (err) {
            if (err.status === 403) {
                return { success: false, message: t('error.email_not_confirm') };
            }
            return { success: false, message: err.data?.message || t('common.error') };
        }
    }, [t]);

    const blockUser = useCallback(async (username) => {
        try {
            await FriendService.blockUser(username);
            return { success: true, message: t('friends.user_blocked') };
        } catch (err) {
            if (err.status === 403) {
                return { success: false, message: t('error.email_not_confirm') };
            }
            return { success: false, message: err.data?.message || t('common.error') };
        }
    }, [t]);

    const unblockUser = useCallback(async (username) => {
        try {
            await FriendService.unblockUser(username);
            return { success: true, message: t('friends.user_unblocked') };
        } catch (err) {
            if (err.status === 403) {
                return { success: false, message: t('error.email_not_confirm') };
            }
            return { success: false, message: err.data?.message || t('common.error') };
        }
    }, [t]);

    return {
        addFriend,
        acceptRequest,
        removeFriend,
        blockUser,
        unblockUser
    };
};