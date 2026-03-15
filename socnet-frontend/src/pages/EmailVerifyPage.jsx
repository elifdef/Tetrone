import { useEffect, useState, useContext } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import AuthService from '../services/auth.service';

const EmailVerifyPage = () => {
    const { t } = useTranslation();
    const { id, hash } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, setUser } = useContext(AuthContext);

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState(t('info.verification_email'));

    useEffect(() => {
        let isMounted = true;

        if (user?.email_verified_at) {
            navigate(`/${user.username}`);
            return;
        }

        const verifyEmail = async () => {
            try {
                const query = searchParams.toString();
                // Використовуємо наш новий сервіс
                const data = await AuthService.verifyEmail(id, hash, query);

                if (isMounted) {
                    setStatus('success');
                    setMessage(data.message || t('success.email_confirm'));

                    const verifiedDate = new Date().toISOString();
                    if (setUser) {
                        setUser(prev => ({ ...prev, email_verified_at: verifiedDate }));
                    }

                    const channel = new BroadcastChannel('auth_channel');
                    channel.postMessage({
                        type: 'EMAIL_VERIFIED',
                        date: verifiedDate
                    });

                    setTimeout(() => {
                        channel.close();
                        if (isMounted) {
                            navigate(`/${user?.username || ''}`);
                        }
                    }, 3000);
                }

            } catch (error) {
                if (isMounted) {
                    setStatus('error');
                    // fetchClient віддає помилку в error.data
                    setMessage(error.data?.message || t('error.email_invalid_link'));
                }
            }
        };

        verifyEmail();

        return () => {
            isMounted = false;
        };
    }, [id, hash, searchParams, navigate, setUser, user, t]);

    return (
        <div className="socnet-verify-container">
            {status === 'loading' && (
                <h2 className="socnet-verify-title">
                    {message}
                </h2>
            )}

            {status === 'success' && (
                <h2 className="socnet-text-success">
                    {t('success.email_confirm')}
                </h2>
            )}

            {status === 'error' && (
                <div className="socnet-verify-error-box">
                    <h2 className="socnet-text-error">
                        {t('error.validation')}
                    </h2>
                    <p className="socnet-verify-message">
                        {message}
                    </p>
                </div>
            )}
        </div>
    );
};

export default EmailVerifyPage;