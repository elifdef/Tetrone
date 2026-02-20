import { useTranslation } from 'react-i18next';

const WallLoader = ({
    isPageLoading,
    isLoadingMore,
    hasMore,
    postsCount,
    loaderRef
}) => {
    const { t } = useTranslation();

    const style = {
        padding: '20px',
        textAlign: 'center',
        color: 'var(--theme-text-muted)',
        fontSize: '12px',
        width: '100%',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
    };

    if (isPageLoading)
        return <div style={style}>{t('common.loading')}...</div>;

    if (postsCount === 0 && !isLoadingMore)
        return <div style={style}>{t('wall.no_posts')}</div>;

    return (
        <div style={{ width: '100%' }}>
            {isLoadingMore && (
                <div style={style}>
                    {t('common.loading')}...
                </div>
            )}

            {/* тригер для скролу */}
            {hasMore && (
                <div
                    ref={loaderRef}
                    style={{ height: '20px', margin: '10px 0', opacity: 0 }}
                />
            )}

            {!hasMore && postsCount > 0 && (
                <div style={style}>
                    {t('wall.no_more_posts')}
                </div>
            )}
        </div>
    );
};

export default WallLoader;