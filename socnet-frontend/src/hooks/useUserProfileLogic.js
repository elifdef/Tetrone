import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import FriendService from "../services/friend.service";
import { notifyError, notifyInfo, notifySuccess } from "../components/common/Notify";
import { useModal } from "../context/ModalContext";
import { useTranslation } from 'react-i18next';

export const useUserProfileLogic = (currentUser, isPreview = false) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { openConfirm } = useModal();

    const [status, setStatus] = useState(currentUser?.friendship_status || 'none');
    const [loading, setLoading] = useState(false);

    const sameUser = user && currentUser && currentUser.username === user.username;
    const isBlockedByMe = !isPreview && status === 'blocked_by_me';
    const isBlockedByTarget = !isPreview && status === 'blocked_by_target';
    const isFriend = status === 'friends';
    const isBanned = currentUser?.is_banned === true;
    const displayAvatar = currentUser?.avatar;

    const getDisplayBio = () => {
        if (isBanned) return t('profile.banned_status');

        if (isBlockedByTarget) {
            const genderSuffix = currentUser?.gender === 2 ? "f" : "m";
            return t(`profile.restricted_profile_${genderSuffix}`, { name: currentUser.first_name });
        }

        if (currentUser?.bio) return currentUser.bio;

        return isPreview ? t('profile.your_status') : t('profile.status_not_set');
    };

    const getField = (value, formatter = null) => {
        if (isBlockedByTarget || isBanned) return t('profile.hidden');
        if (!value) return t('profile.not_specified');
        return formatter ? formatter(value) : value;
    };

    const displayBirth = getField(currentUser?.birth_date);
    const displayCountry = getField(currentUser?.country);
    const displayBio = getDisplayBio();

    const displayGender = getField(currentUser?.gender, (g) => {
        if (g === 1) return t('common.male');
        if (g === 2) return t('common.female');
        return t('settings.not_selected');
    });

    useEffect(() => {
        setStatus(currentUser?.friendship_status || 'none');
    }, [currentUser]);

    const handleFriendshipAction = async () => {
        if (loading || !currentUser?.username) return;
        setLoading(true);

        let res;
        let nextStatus = status;

        switch (status) {
            case 'none':
                res = await FriendService.addFriend(currentUser.username);
                if (res.success) nextStatus = 'pending_sent';
                break;
            case 'pending_sent':
                res = await FriendService.removeFriend(currentUser.username);
                if (res.success) nextStatus = 'none';
                break;
            case 'pending_received':
                res = await FriendService.acceptRequest(currentUser.username);
                if (res.success) nextStatus = 'friends';
                break;
            case 'friends':
                const confirmed = await openConfirm(`${t('friends.remove_friends')}?`);
                if (confirmed) {
                    res = await FriendService.removeFriend(currentUser.username);
                    if (res.success) nextStatus = 'none';
                } else {
                    setLoading(false);
                    return;
                }
                break;
            default:
                setLoading(false);
                return;
        }

        if (res) {
            if (res.success) {
                setStatus(nextStatus);
                if (status === 'none' || status === 'pending_received') {
                    notifySuccess(res.message);
                }
            } else {
                notifyError(res.message);
            }
        }

        setLoading(false);
    };

    const handleBlockAction = async () => {
        if (loading || !currentUser?.username) return;

        if (isBlockedByMe) {
            setLoading(true);
            const res = await FriendService.unblockUser(currentUser.username);

            if (res.success) {
                setStatus('none');
                notifyInfo(res.message);
            } else {
                notifyError(res.message);
            }
            setLoading(false);
        } else {
            const confirmed = await openConfirm(`${t('common.to_block')} @${currentUser.username}?`);
            if (confirmed) {
                setLoading(true);
                const res = await FriendService.blockUser(currentUser.username);

                if (res.success) {
                    setStatus('blocked_by_me');
                    notifyInfo(res.message);
                } else {
                    notifyError(res.message);
                }
                setLoading(false);
            }
        }
    };

    return { status, loading, sameUser, isBlockedByMe, isBlockedByTarget, isBanned, isFriend, displayAvatar, displayBio, displayBirth, displayCountry, displayGender, handleFriendshipAction, handleBlockAction };
};