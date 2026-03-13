import { useTranslation } from "react-i18next";
import { useDateFormatter } from "../../../hooks/useDateFormatter";
import isoCountries from "i18n-iso-countries";

export default function Info({ currentUser, displayBio, displayBirth, displayCountry, displayGender, isPreview, isBlockedByTarget, isBanned }) {
    const { t, i18n } = useTranslation();
    const formatDate = useDateFormatter();
    const langCode = i18n.language || 'en';

    return (
        <div className="socnet-modern-body">
            {displayBio && (
                <div className="socnet-modern-bio">{displayBio}</div>
            )}

            {(isPreview || (!isBlockedByTarget && !isBanned)) && (
                <div className="socnet-modern-info-grid">
                    <div className="socnet-modern-info-item">
                        <span className="socnet-modern-info-label">{t('common.birthday')}</span>
                        <span className="socnet-modern-info-val">
                            {currentUser?.birth_date ? formatDate(currentUser.birth_date, { withTime: false, useRelative: false }) : displayBirth}
                        </span>
                    </div>

                    <div className="socnet-modern-info-item">
                        <span className="socnet-modern-info-label">{t('common.country')}</span>
                        <span className="socnet-modern-info-val">
                            {currentUser?.country && currentUser.country.length === 2 ? (
                                <span className="profile-country-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className={`fi fi-${currentUser.country.toLowerCase()}`}></span>
                                    <span>{isoCountries.getName(currentUser.country, langCode) || currentUser.country}</span>
                                </span>
                            ) : (
                                displayCountry
                            )}
                        </span>
                    </div>

                    <div className="socnet-modern-info-item">
                        <span className="socnet-modern-info-label">{t('common.gender')}</span>
                        <span className="socnet-modern-info-val">{displayGender}</span>
                    </div>

                    <div className="socnet-modern-info-item">
                        <span className="socnet-modern-info-label">{t('profile.joined')}</span>
                        <span className="socnet-modern-info-val">
                            {currentUser?.created_at ? formatDate(currentUser.created_at, { withTime: true, forceYear: true }) : ''}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}