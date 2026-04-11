import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { useTranslation } from 'react-i18next';

import FeedService from "../services/feed.service";
import { usePageTitle } from "../hooks/usePageTitle";
import PostItem from "../components/post/PostItem";
import InfiniteScrollList from "../components/common/InfiniteScrollList";
import { AuthContext } from "../context/AuthContext";

export default function HomePage() {
    const { t } = useTranslation();
    usePageTitle(t('common.posts'));

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'feed';
    const { user: authUser } = useContext(AuthContext);
    const queryClient = useQueryClient();

    const handleTabChange = (tab) => {
        if (activeTab === tab) return;
        setSearchParams({ tab });
    };

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['feed', activeTab], // Кеш окремо для 'feed' і 'global'
        queryFn: ({ pageParam = 1, signal }) => FeedService.getFeed(activeTab, pageParam, signal),
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta;
            return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        }
    });

    const posts = data?.pages.flatMap(page => page.data || []) || [];

    const handleRepostSuccess = (newPost) => {
        queryClient.setQueryData(['feed', activeTab], (oldData) => {
            if (!oldData) return oldData;
            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
                newPages[0] = { ...newPages[0], data: [newPost, ...newPages[0].data] };
            }
            return { ...oldData, pages: newPages };
        });
    };

    const EmptyState = () => (
        <div className="tetrone-empty-state with-card">
            <h3>{t('common.welcome')}!</h3>
            {activeTab === 'feed' ? (
                <>
                    <p>{t('empty.feed')}</p>
                    <div className="tetrone-feed-actions">
                        <Link to="/friends?tab=all" className="">
                            {t('feed.find_friends')}
                        </Link>
                        <button className="" onClick={() => handleTabChange('global')}>
                            {t('feed.view_global_feed')}
                        </button>
                    </div>
                </>
            ) : (
                <p>{t('empty.feed')}</p>
            )}
        </div>
    );

    return (
        <div className="tetrone-feed-page">
            <div className="tetrone-tabs">
                <button className={`tetrone-tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => handleTabChange('feed')}>
                    {t('feed.my_feed')}
                </button>
                <button className={`tetrone-tab ${activeTab === 'global' ? 'active' : ''}`} onClick={() => handleTabChange('global')}>
                    {t('feed.global_feed')}
                </button>
            </div>

            <InfiniteScrollList
                itemsCount={posts.length}
                isLoadingInitial={isLoading}
                isLoadingMore={isFetchingNextPage}
                hasMore={!!hasNextPage}
                onLoadMore={fetchNextPage}
                error={isError}
                onRetry={refetch}
                emptyState={<EmptyState />}
            >
                {posts.map(post => (
                    <PostItem
                        key={post.id}
                        post={post}
                        currentUserId={authUser?.id}
                        isOwner={authUser?.id === post.user?.id}
                        onRepostSuccess={handleRepostSuccess}
                    />
                ))}
            </InfiniteScrollList>
        </div>
    );
}