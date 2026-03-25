import { useEmailVerification } from '../../hooks/useEmailVerification';

const EmailVerificationBanner = () => {
    const { user, loading, verifyStatus, statusMessage, setVerifyStatus, handleResend, t } = useEmailVerification();

    if (!user || verifyStatus === 'hidden' || (user.email_verified_at && verifyStatus === 'idle')) {
        return null;
    }

    if (!user || (user.email_verified_at && verifyStatus !== 'success')) {
        return null;
    }

    if (verifyStatus === 'verifying') {
        return (
            <div className="email-verify-block">
                <span className="email-verify-text pulse">{statusMessage}</span>
            </div>
        );
    }

    if (verifyStatus === 'success') {
        return (
            <div className="email-verify-block success-animation">
                <span className="email-verify-text">{statusMessage}</span>
            </div>
        );
    }

    if (verifyStatus === 'error') {
        return (
            <div className="email-verify-block error">
                <span className="email-verify-text">{statusMessage}</span>
                <button className="email-verify-btn" onClick={() => setVerifyStatus('idle')}>OK</button>
            </div>
        );
    }

    return (
        <div className="email-verify-block">
            <span className="email-verify-text">
                {t('banner.email.text')}
            </span>
            <button
                className="email-verify-btn"
                onClick={handleResend}
                disabled={loading}
            >
                {loading ? t('common.sending') : t('banner.email.send')}
            </button>
        </div>
    );
};

export default EmailVerificationBanner;