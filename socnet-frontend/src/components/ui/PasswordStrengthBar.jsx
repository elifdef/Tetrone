import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return score;

    if (password.length >= 8) score += 1; // довжина
    if (/[a-z]/.test(password)) score += 1; // мала буква
    if (/[A-Z]/.test(password)) score += 1; // велика буква
    if (/\d/.test(password)) score += 1; // цифра
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // спецсимвол

    return score;
};

const getStrengthColor = (score) => score ? 'var(--theme-btn-bg)' : 'transparent';

const PasswordStrengthBar = ({ password, onScoreChange }) => {
    const { t } = useTranslation();
    const score = useMemo(() => calculatePasswordStrength(password), [password]);
    
    useEffect(() => {
        if (onScoreChange) {
            onScoreChange(score);
        }
    }, [score, onScoreChange]);

    if (!password) return null;

    return (
        <div className="tetrone-password-strength-wrapper">
            <div className="tetrone-password-strength-track">
                <div 
                    className="tetrone-password-strength-bar"
                    style={{
                        width: `${(score / 5) * 100}%`,
                        backgroundColor: getStrengthColor(score)
                    }}
                ></div>
            </div>
            <div className="tetrone-password-strength-text">
                {t('auth.password_requirements')}
            </div>
        </div>
    );
};

export default PasswordStrengthBar;