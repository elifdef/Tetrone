import { useEffect, useRef } from 'react';

export const useIntersectionObserver = (callback, hasMore, isLoading) => {
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                //якщо елемент появиться на екрані є ще сторінки
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    callback();
                }
            },
            { threshold: 0.1 } //спрацьовує коли елемент хоча б на 10% видно на екрані
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [callback, hasMore, isLoading]);

    return observerTarget;
};