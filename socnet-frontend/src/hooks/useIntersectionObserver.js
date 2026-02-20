import { useCallback, useRef } from 'react';

export const useIntersectionObserver = (callback, hasMore, isLoading) => {
    // observer у ref щоб мати до нього доступ між рендерами
    const observer = useRef();

    // реакт викличе цю функцію як тільки нода появиться в дом
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore)
                callback();
        });

        if (node) observer.current.observe(node);
    }, [isLoading, hasMore, callback]);

    return lastElementRef;
};