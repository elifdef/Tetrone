import { useContext } from "react";
import { useUserProfileLogic } from "../../hooks/useUserProfileLogic";
import { AuthContext } from "../../context/AuthContext";
import ProfileAvatar from "./ProfileAvatar";
import ProfileActions from "./ProfileActions";
import ProfileHeader from "./ProfileHeader";
import ProfileStatus from "./ProfileStatus";
import ProfileInfo from "./ProfileInfo";

export default function UserProfileCard({ currentUser, isPreview = false }) {
    const { user: authUser } = useContext(AuthContext);
    if (!currentUser)
        return null;

    const {
        status, loading, sameUser,
        isBlockedByMe, isBlockedByTarget,
        displayAvatar, displayBio, displayBirth, displayCountry, displayGender,
        handleFriendshipAction, handleBlockAction
    } = useUserProfileLogic(currentUser, isPreview);

    return (
        <div className="socnet-card-wrapper">
            <div className="socnet-container">
                <div className="socnet-left-col">
                    <ProfileAvatar
                        user={{ ...currentUser, avatar: displayAvatar }}
                        isPreview={isPreview}
                        isBlocked={isBlockedByTarget}
                    />

                    {!isPreview && authUser && (!isPreview || sameUser) && (
                        <ProfileActions
                            sameUser={sameUser}
                            loading={loading}
                            status={status}
                            isBlockedByMe={isBlockedByMe}
                            isBlockedByTarget={isBlockedByTarget}
                            onFriendAction={handleFriendshipAction}
                            onBlockAction={handleBlockAction}
                        />
                    )}
                </div>

                <div className="socnet-right-col">
                    <ProfileHeader user={currentUser} />

                    <ProfileStatus bio={displayBio} />
                    {(isPreview || !isBlockedByTarget) && (
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
        </div>
    );
}