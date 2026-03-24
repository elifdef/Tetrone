import { useEffect, useState, useContext } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import UserService from "../services/user.service";
import { AuthContext } from "../context/AuthContext";
import NotFoundPage from "./NotFoundPage";
import UserProfileCard from "../components/profile/UserProfileCard";
import UserWall from "../components/post/UserWall";
import { usePageTitle } from "../hooks/usePageTitle";
import ErrorState from "../components/ui/ErrorState";

export default function ProfilePage() {
    const { t } = useTranslation();
    const { username } = useParams();
    usePageTitle(username);

    const { user: authUser } = useContext(AuthContext);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [notFound, setNotFound] = useState(false);
    const [serverError, setServerError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        setNotFound(false);
        setServerError(false);
        setLoading(true);

        UserService.getProfile(username)
            .then(res => {
                if (isMounted) {
                    if (res.success) {
                        setProfile(res.data);
                    } else {
                        if (res.status === 404) {
                            setNotFound(true);
                        } else {
                            setServerError(true);
                            // console.error("Failed to load profile:", res.message);
                        }
                    }
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [username]);

    if (notFound) return <NotFoundPage />;

    if (serverError)
        return (
            <div className="tetrone-profile-error-wrapper">
                <ErrorState
                    title={t('error.connection')}
                    description={t('error.loading', { resource: t('common.profile').toLowerCase() })}
                />
            </div>
        );

    if (loading) return <div className="tetrone-empty-state">{t('common.loading')}</div>;
    if (!profile) return null;

    const isOwnProfile = authUser && authUser.username === profile.username;

    // якщо це МІЙ профіль і він НЕ готовий 
    if (isOwnProfile && !profile.is_setup_complete)
        return <Navigate to="/setup-profile" replace />;

    // якщо це ЧУЖИЙ профіль і він НЕ готовий 
    if (!profile.is_setup_complete)
        return (
            <div className="not-setup-profile">
                <h2>{t('profile.not_setup')}</h2>
                <p>{t('profile.not_setup_desc', { name: profile.username })}</p>
            </div>
        );

    return (
        <>
            <UserProfileCard currentUser={profile} />
            {(profile.friendship_status !== "blocked_by_target" && !profile.is_banned) && (
                <UserWall profileUser={profile} isOwnProfile={isOwnProfile} />
            )}
        </>
    );
}