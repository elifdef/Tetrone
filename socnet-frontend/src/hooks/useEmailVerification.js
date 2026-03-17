import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useMatch } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { AuthContext } from "../context/AuthContext";
import { notifyError, notifyInfo } from "../components/common/Notify";

export const useEmailVerification = () => {
    const { user, setUser } = useContext(AuthContext);
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const match = useMatch('/email-verify/:id/:hash');

    const [loading, setLoading] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        if (match && !user?.email_verified_at && verifyStatus === 'idle') {
            const verifyEmail = async () => {
                setVerifyStatus('verifying');
                setStatusMessage(t('info.verification_email'));

                const query = location.search;
                const res = await AuthService.verifyEmail(match.params.id, match.params.hash, query);

                if (res.success) {
                    const verifiedDate = new Date().toISOString();

                    const channel = new BroadcastChannel('auth_channel');
                    channel.postMessage({ type: 'EMAIL_VERIFIED', date: verifiedDate });
                    channel.close();

                    setVerifyStatus('success');
                    setStatusMessage(res.message);

                    setTimeout(() => {
                        setVerifyStatus('hidden');
                        setUser(prev => ({ ...prev, email_verified_at: verifiedDate }));
                        navigate('/', { replace: true });
                    }, 5000);
                } else {
                    setVerifyStatus('error');
                    setStatusMessage(res.message);
                    setTimeout(() => navigate('/', { replace: true }), 3000);
                }
            };
            verifyEmail();
        }
    }, [match, location.search, user, verifyStatus, navigate, setUser, t]);

    const handleResend = async () => {
        setLoading(true);
        const res = await AuthService.resendVerification();

        if (res.success) {
            notifyInfo(res.message || t('info.email_send_letter'));
        } else {
            notifyError(res.message || t('error.email_send'));
        }

        setLoading(false);
    };

    return { user, loading, verifyStatus, statusMessage, setVerifyStatus, handleResend, t };
};