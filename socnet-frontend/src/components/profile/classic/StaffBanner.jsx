import { useTranslation } from "react-i18next";
import { APP_NAME } from "../../../config";
import { VerifiedIcon } from "../../ui/Icons";

const StaffBanner = ({ userRole }) => {
    const { t } = useTranslation();
    const getRoleTitle = (role) => {
        switch (role) {
            case 1: return t('common.support');
            case 2: return t('common.moderator');
            case 3: return t('common.admin');
            default: return null;
        }
    };

    return (
        <div className="tetrone-staff-top-banner">
            <div className="staff-banner-left">
                <span className="staff-name">{getRoleTitle(userRole)} {APP_NAME}</span>
                <span className="tetrone-verified-badge" title={getRoleTitle(userRole)}>
                    <VerifiedIcon />
                </span>
            </div>
        </div>
    );
};

export default StaffBanner;