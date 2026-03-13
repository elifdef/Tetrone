import ClassicProfileCard from "./classic/ClassicProfileCard";
import ModernProfileCard from "./modern/ModernProfileCard";

export default function UserProfileCard({ currentUser, isPreview = false, forceTheme = null }) {
    if (!currentUser) return null;

    const localTheme = localStorage.getItem('app_profile_theme') || 'modern';
    const activeTheme = forceTheme || localTheme;

    if (activeTheme === 'classic') {
        return <ClassicProfileCard currentUser={currentUser} isPreview={isPreview} />;
    }

    return <ModernProfileCard currentUser={currentUser} isPreview={isPreview} />;
}