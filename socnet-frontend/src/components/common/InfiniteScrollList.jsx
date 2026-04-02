import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export default function InfiniteScrollList({
    children,            // пости результат map
    itemsCount,          // кількість елементів
    isLoadingInitial,    // чи йде перше завантаження сторінки
    isLoadingMore,       // чи підвантажується наступна сторінка
    hasMore,             // чи є ще що вантажити
    onLoadMore,          // функція яка завантажує наступну сторінку
    error = false,       // чи є помилка
    onRetry = null,      // функція для повторної спроби
    emptyState = null,   // компонент, який показуємо якщо пусто
    endMessage = null,   // текст в самому кінці
    className = "tetrone-feed-list"
}) {
    const { t } = useTranslation();
    const loaderRef = useIntersectionObserver(onLoadMore, hasMore, isLoadingMore);

    // перше завантаження
    if (isLoadingInitial) {
        return (
            <div className="tetrone-empty-state">
                {t('common.loading')}
            </div>
        );
    }

    // помилка при першому завантаженні (коли список порожній)
    if (error && itemsCount === 0) {
        return (
            <div className="tetrone-empty-state with-card">
                <h3>{t('error.connection')}</h3>
                {onRetry && (
                    <button className="tetrone-btn-retry" onClick={onRetry}>
                        {t('common.reload_page')}
                    </button>
                )}
            </div>
        );
    }

    // немає постів взагалі
    if (itemsCount === 0) {
        return emptyState || (
            <div className="tetrone-empty-state with-card">
                {t('common.no_more_data')}
            </div>
        );
    }

    // список із вічним скролом
    return (
        <div className={className}>
            {children}

            {/* підвантаження наступної сторінки */}
            {hasMore && !error && (
                <div ref={loaderRef} className="tetrone-infinite-scroll-msg">
                    {isLoadingMore ? t('common.loading') + '...' : ''}
                </div>
            )}

            {/* кінець списку */}
            {!hasMore && itemsCount > 0 && (
                <div className="tetrone-infinite-scroll-msg">
                    {endMessage}
                </div>
            )}

            {/* помилка при підвантаженні наступної сторінки */}
            {error && itemsCount > 0 && (
                <div className="tetrone-infinite-error-box">
                    <span className="tetrone-error-text">
                        {t('error.connection')}
                    </span>
                    <br />
                    {onRetry && (
                        <button className=" tetrone-btn-retry-small" onClick={onRetry}>
                            {t('common.reload_page')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}