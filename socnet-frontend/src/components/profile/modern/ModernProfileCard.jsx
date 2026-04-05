import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useUserProfileLogic } from "../hooks/useUserProfileLogic";
import { AuthContext } from "../../../context/AuthContext";
import ReportModal from "../../modals/ReportModal";
import { userRole } from "../../../config";
import StaffBanner from "../classic/StaffBanner";
import Banner from "./Banner";
import Header from "./Header";
import Info from "./Info";

export default function ModernProfileCard({ currentUser, isPreview = false }) {
    const { user: authUser } = useContext(AuthContext);
    const { t } = useTranslation();

    if (!currentUser) return null;

    const {
        status, loading, sameUser,
        isBanned, isBlockedByMe, isBlockedByTarget,
        displayAvatar, displayBio, displayBirth, displayCountry, displayGender,
        handleFriendshipAction, handleBlockAction
    } = useUserProfileLogic(currentUser, isPreview);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const isStaff = currentUser.role >= userRole.Support;

    const customNameColor = currentUser.personalization?.username_color || 'var(--theme-text-main)';

    const isPrivateProfile = currentUser.is_private && !sameUser;
    const effectiveBio = isPrivateProfile ? t('privacy.account_is_private') : displayBio;

    return (
        <div className="tetrone-modern-wrapper">
            {!isPreview && isStaff && !isBanned && <StaffBanner userRole={currentUser.role} />}

            <Banner personalization={currentUser?.personalization} />

            <Header
                currentUser={currentUser} isPreview={isPreview} displayAvatar={displayAvatar}
                isBlockedByTarget={isBlockedByTarget} isBanned={isBanned} authUser={authUser}
                sameUser={sameUser} loading={loading} status={status} isBlockedByMe={isBlockedByMe}
                handleFriendshipAction={handleFriendshipAction} handleBlockAction={handleBlockAction}
                onReportAction={() => setIsReportModalOpen(true)}
                customNameColor={customNameColor}
                isPrivateProfile={isPrivateProfile}
            />

            <Info
                currentUser={currentUser} displayBio={effectiveBio}
                displayBirth={displayBirth} displayCountry={displayCountry} displayGender={displayGender}
                isPreview={isPreview} isBlockedByTarget={isBlockedByTarget} isBanned={isBanned}
                isPrivateProfile={isPrivateProfile}
            />

            {currentUser && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    targetType="user"
                    targetId={currentUser.id}
                />
            )}
        </div>
    );
}