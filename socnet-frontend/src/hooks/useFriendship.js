import { useCallback } from "react";
import FriendService from "../services/friend.service";

export const useFriendship = () => {

    const addFriend = useCallback(async (username) => {
        return await FriendService.addFriend(username);
    }, []);

    const acceptRequest = useCallback(async (username) => {
        return await FriendService.acceptRequest(username);
    }, []);

    const removeFriend = useCallback(async (username) => {
        return await FriendService.removeFriend(username);
    }, []);

    const blockUser = useCallback(async (username) => {
        return await FriendService.blockUser(username);
    }, []);

    const unblockUser = useCallback(async (username) => {
        return await FriendService.unblockUser(username);
    }, []);

    return { addFriend, acceptRequest, removeFriend, blockUser, unblockUser };
};