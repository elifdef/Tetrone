import { useState, useCallback } from 'react';
import MessageService from '../../../services/chat.service';
import { notifyError } from '../../common/Notify';

export const useInbox = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchChats = useCallback(async () => {
        setLoading(true);
        const res = await MessageService.getChats();

        if (res.success) {
            setChats(res.data || []);
        } else {
            notifyError(res.message);
        }

        setLoading(false);
    }, []);

    return { chats, fetchChats, loading };
};