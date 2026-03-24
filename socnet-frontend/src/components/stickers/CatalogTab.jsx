import { useTranslation } from 'react-i18next';
import InfiniteScrollList from '../common/InfiniteScrollList';
import PackCard from './PackCard';

export default function CatalogTab({ packs, isLoading, page, hasMore, onLoadMore, onSelectPack }) {
    const { t } = useTranslation();

    return (
        <InfiniteScrollList
            itemsCount={packs.length}
            isLoadingInitial={isLoading && page === 1}
            isLoadingMore={isLoading && page > 1}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            className="tetrone-pack-grid"
        >
            {packs.map(pack => (
                <PackCard key={pack.id} pack={pack} onClick={onSelectPack} />
            ))}
        </InfiniteScrollList>
    );
}