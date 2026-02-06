import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { usePageTitle } from "../hooks/usePageTitle";
import PostItem from "../components/post/PostItem";
import { mapPost } from "../services/mappers";
import { notifyError } from "../components/Notify";

export default function HomePage() {
    usePageTitle("Новини");

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'feed';
    const [error, setError] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const abortControllerRef = useRef(null);

    const handleTabChange = (tab) => {
        if (activeTab === tab)
            return;

        setLoading(true);
        setPosts([]);
        setError(false);
        setSearchParams({ tab });
    };

    useEffect(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const newController = new AbortController();
        abortControllerRef.current = newController;

        const fetchFeed = async () => {
            try {
                setError(false);
                const endpoint = activeTab === 'global' ? '/feed/global' : '/feed';
                const res = await api.get(endpoint, { signal: newController.signal });
                setPosts(res.data.data.map(mapPost));
            } catch (err) {
                if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
                    setError(true);
                    notifyError("Помилка завантаження стрічки");
                }
            } finally {
                if (!newController.signal.aborted) setLoading(false);
            }
        };

        fetchFeed();
        return () => newController.abort();
    }, [activeTab]);

    const EmptyState = () => (
        <div className="vk-feed-empty">
            <h3>Ласкаво просимо</h3>

            {activeTab === 'feed' ? (
                <>
                    <p>
                        Ваша стрічка новин поки порожня. <br />
                        Знайдіть друзів або перегляньте глобальну стрічку.
                    </p>
                    <div className="vk-feed-actions">
                        <Link to="/friends?tab=all" className="vk-btn-small" style={{ textDecoration: 'none', color: '#fff' }}>
                            Знайти друзів
                        </Link>
                        <button
                            className="vk-btn-small"
                            onClick={() => handleTabChange('global')}
                        >
                            Всі публікації
                        </button>
                    </div>
                </>
            ) : (
                <p>
                    У цій соцмережі поки немає жодного поста.<br />
                    Станьте першим, хто це зробить, і увійдіть в історію!
                </p>
            )}
        </div>
    );

    const ErrorState = () => (
        <div className="vk-feed-empty">
            <h3>Помилка з'єднання</h3>
            <p>Сталася помилка при завантаженні постів.</p>
            <div className="vk-feed-actions">
                <button
                    className="vk-btn-small"
                    onClick={() => window.location.reload()}
                >
                    Оновити сторінку
                </button>
            </div>
        </div>
    );

    return (
        <div className="vk-feed-page">
            <div className="vk-feed-tabs">
                <button
                    className={`vk-feed-tab ${activeTab === 'feed' ? 'active' : ''}`}
                    onClick={() => handleTabChange('feed')}>
                    Мої новини
                </button>
                <button
                    className={`vk-feed-tab ${activeTab === 'global' ? 'active' : ''}`}
                    onClick={() => handleTabChange('global')}>
                    Глобальний пошук
                </button>
            </div>

            {loading ? (
                <div className="vk-feed-loading">
                    Завантаження...
                </div>
            ) : (
                <div className="vk-feed-list">
                    {error ? (
                        <ErrorState />
                    ) : posts.length > 0 ? (
                        posts.map(post => (
                            <PostItem key={post.id} post={post} />
                        ))
                    ) : (
                        <EmptyState />
                    )}
                </div>
            )}
        </div>
    );
}