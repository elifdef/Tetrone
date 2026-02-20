import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const calculatePasswordStrength = (password) => {
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
        <div style={{ marginTop: '-5px', marginBottom: '10px' }}>
            <div style={{
                height: '4px',
                background: 'var(--theme-border)',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${(score / 5) * 100}%`,
                    background: getStrengthColor(score),
                    transition: 'width 0.3s ease, background 0.3s ease'
                }}></div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                {t('auth.password_requirements')}
            </div>
        </div>
    );
};

export default PasswordStrengthBar;