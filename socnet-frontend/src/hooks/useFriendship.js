import api from "../api/axios";
import { useCallback } from "react";

export const useFriendship = () => {

    // useCallback щоб функції не перестворювались при рендерах
    const addFriend = useCallback(async (username) => {
        try {
            await api.post('/friends/add', { username });
            return { success: true, message: "Заявку надіслано!" };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Помилка" };
        }
    }, []);

    const acceptRequest = useCallback(async (username) => {
        try {
            await api.post('/friends/accept', { username });
            return { success: true, message: "Заявку прийнято!" };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Помилка" };
        }
    }, []);

    const removeFriend = useCallback(async (username) => {
        try {
            await api.delete(`/friends/${username}`);
            return { success: true, message: "Користувача видалено/відхилено" };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Помилка" };
        }
    }, []);

    const blockUser = useCallback(async (username) => {
        try {
            await api.post('/friends/block', { username });
            return { success: true, message: "Користувача заблоковано" };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Помилка" };
        }
    }, []);

    const unblockUser = useCallback(async (username) => {
        try {
            await api.delete(`/friends/blocked/${username}`);
            return { success: true, message: "Користувача розблоковано" };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Помилка" };
        }
    }, []);

    return {
        addFriend,
        acceptRequest,
        removeFriend,
        blockUser,
        unblockUser
    };
};