import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useUserProfileLogic } from "../hooks/useUserProfileLogic";
import { AuthContext } from "../../../context/AuthContext";
import ReportModal from "../../modals/ReportModal";
import { userRole } from "../../../config";
import ProfileAvatar from "./ProfileAvatar";
import ProfileActions from "./ProfileActions";
import ProfileHeader from "./ProfileHeader";
import ProfileStatus from "./ProfileStatus";
import ProfileInfo from "./ProfileInfo";
import StaffBanner from "./StaffBanner";

export default function ClassicProfileCard({ currentUser, isPreview = false }) {
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
    const isPrivateProfile = currentUser.is_private && !sameUser;

    const effectiveBio = isPrivateProfile ? t('privacy.account_is_private') : displayBio;

    return (
        <div className="tetrone-card-wrapper">
            {!isPreview && isStaff && !isBanned && <StaffBanner userRole={currentUser.role} />}
            <div className="tetrone-container">
                <div className="tetrone-left-col">
                    <ProfileAvatar
                        user={{ ...currentUser, avatar: displayAvatar }}
                        isPreview={isPreview}
                        isBlocked={isBlockedByTarget || isBanned || isPrivateProfile}
                    />

                    {!isPreview && authUser && (!isPreview || sameUser) && (
                        <ProfileActions
                            sameUser={sameUser}
                            userId={currentUser.id}
                            loading={loading}
                            status={status}
                            isBlockedByMe={isBlockedByMe}
                            isBlockedByTarget={isBlockedByTarget}
                            onFriendAction={handleFriendshipAction}
                            onBlockAction={handleBlockAction}
                            isBanned={isBanned}
                            onReportAction={() => setIsReportModalOpen(true)}
                            permissions={currentUser.permissions}
                        />
                    )}
                </div>

                <div className="tetrone-right-col">
                    <ProfileHeader user={currentUser} isPreview={isPreview} />

                    <ProfileStatus bio={effectiveBio} />

                    {(isPreview || (!isBlockedByTarget && !isBanned && !isPrivateProfile)) && (
                        <ProfileInfo
                            user={currentUser}
                            displayBirth={displayBirth}
                            displayCountry={displayCountry}
                            displayGender={displayGender}
                            showFriendsBlock={!isPreview}
                        />
                    )}
                </div>
            </div>
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