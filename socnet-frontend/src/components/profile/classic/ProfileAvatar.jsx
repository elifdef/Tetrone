import { useState } from "react";
import PostService from "../../../services/post.service";
import { notifyError } from "../../common/Notify";
import { useTranslation } from "react-i18next";
import PhotoModal from "../../UI/PhotoModal";

export default function ProfileAvatar({ user, isPreview, isBlocked }) {
    const { t } = useTranslation();

    const [avatarPosts, setAvatarPosts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const hasCustomAvatar = user?.avatar && !user.avatar.includes('defaultAvatar');
    const canViewAvatar = !isPreview && !isBlocked && hasCustomAvatar;

    const handleAvatarClick = async () => {
        if (!canViewAvatar || isLoading) return;

        setIsLoading(true);
        const res = await PostService.getUserAvatars(user.username);

        if (res.success) {
            const posts = res.data || [];
            if (posts.length > 0) {
                setAvatarPosts(posts);
                setCurrentIndex(0);
                setIsPhotoModalOpen(true);
            }
        } else {
            notifyError(res.message);
        }
        setIsLoading(false);
    };

    const nextAvatar = () => setCurrentIndex(prev => (prev + 1) % avatarPosts.length);
    const prevAvatar = () => setCurrentIndex(prev => (prev - 1 + avatarPosts.length) % avatarPosts.length);

    return (
        <div className="tetrone-photo-box">
            <img
                src={user.avatar}
                alt={user.username}
                className={`tetrone-avatar ${(!isPreview && isBlocked) ? 'tetrone-avatar-blocked' : ''} ${canViewAvatar ? 'tetrone-clickable' : ''} ${isLoading ? 'tetrone-loading' : ''}`}
                onClick={handleAvatarClick}
            />

            {avatarPosts.length > 0 && (
                <PhotoModal
                    isOpen={isPhotoModalOpen}
                    post={avatarPosts[currentIndex]}
                    onClose={() => setIsPhotoModalOpen(false)}
                    onNext={avatarPosts.length > 1 ? nextAvatar : null}
                    onPrev={avatarPosts.length > 1 ? prevAvatar : null}
                    listCurrent={currentIndex + 1}
                    listTotal={avatarPosts.length}
                />
            )}
        </div>
    );
}