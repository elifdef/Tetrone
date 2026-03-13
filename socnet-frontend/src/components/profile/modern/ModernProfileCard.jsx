import { useState, useContext } from "react";
import { useUserProfileLogic } from "../../../hooks/useUserProfileLogic";
import { AuthContext } from "../../../context/AuthContext";
import ReportModal from "../../common/ReportModal";
import { userRole } from "../../../config";
import StaffBanner from "../classic/StaffBanner";
import Banner from "./Banner";
import Header from "./Header";
import Info from "./Info";
import "./profile-modern.css";

export default function ModernProfileCard({ currentUser, isPreview = false }) {
    const { user: authUser } = useContext(AuthContext);

    if (!currentUser) return null;

    const {
        status, loading, sameUser,
        isBanned, isBlockedByMe, isBlockedByTarget,
        displayAvatar, displayBio, displayBirth, displayCountry, displayGender,
        handleFriendshipAction, handleBlockAction
    } = useUserProfileLogic(currentUser, isPreview);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const isStaff = currentUser.role >= userRole.Support;

    const bannerBg = currentUser.personalization?.banner_color;
    const customNameColor = currentUser.personalization?.username_color || 'var(--theme-text-main)';

    return (
        <div className="socnet-modern-wrapper">
            {!isPreview && isStaff && !isBanned && <StaffBanner userRole={currentUser.role} />}
            
            <Banner bannerColor={bannerBg} />
            
            <Header 
                currentUser={currentUser} isPreview={isPreview} displayAvatar={displayAvatar}
                isBlockedByTarget={isBlockedByTarget} isBanned={isBanned} authUser={authUser}
                sameUser={sameUser} loading={loading} status={status} isBlockedByMe={isBlockedByMe}
                handleFriendshipAction={handleFriendshipAction} handleBlockAction={handleBlockAction}
                onReportAction={() => setIsReportModalOpen(true)}
                customNameColor={customNameColor}
            />

            <Info 
                currentUser={currentUser} displayBio={displayBio}
                displayBirth={displayBirth} displayCountry={displayCountry} displayGender={displayGender}
                isPreview={isPreview} isBlockedByTarget={isBlockedByTarget} isBanned={isBanned}
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