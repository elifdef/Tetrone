import { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import { notifySuccess, notifyError } from '../common/Notify';
import UserProfileCard from '../profile/UserProfileCard';

const PopoverPicker = ({ color, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={popoverRef}>
            <div
                className="socnet-custom-color-btn"
                style={{ background: color || '#ffffff' }}
                onClick={() => setIsOpen(!isOpen)}
            />
            {isOpen && (
                <div className="socnet-color-popover">
                    <HexColorPicker color={color || '#ffffff'} onChange={onChange} />
                </div>
            )}
        </div>
    );
};

export default function PersonalizationSettings() {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [uiTheme, setUiTheme] = useState(localStorage.getItem('app_profile_theme') || 'modern');

    const [settings, setSettings] = useState({
        banner_color: '',
        username_color: ''
    });

    const [grad, setGrad] = useState({ deg: 135, c1: '#1e3a8a', c2: '#9333ea' });

    useEffect(() => {
        api.get('/settings/personalization')
            .then(res => {
                const bc = res.data.personalization.banner_color || '';
                setSettings({
                    banner_color: bc,
                    username_color: res.data.personalization.username_color || ''
                });

                if (bc.includes('linear-gradient')) {
                    const match = bc.match(/linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{3,8}),\s*(#[0-9a-fA-F]{3,8})\)/);
                    if (match) {
                        setGrad({ deg: parseInt(match[1]), c1: match[2], c2: match[3] });
                    } else {
                        const colors = bc.match(/#[0-9a-fA-F]{3,8}/g);
                        if (colors && colors.length >= 2) {
                            setGrad(prev => ({ ...prev, c1: colors[0], c2: colors[1] }));
                        }
                    }
                }
            })
            .catch(() => notifyError(t('error.connection')))
            .finally(() => setIsLoading(false));
    }, [t]);

    const handleThemeChange = (newTheme) => {
        setUiTheme(newTheme);
        localStorage.setItem('app_profile_theme', newTheme);
        window.dispatchEvent(new Event('theme_changed'));
    };

    const updateGradient = (deg, color1, color2) => {
        setGrad({ deg, c1: color1, c2: color2 });
        setSettings(prev => ({
            ...prev,
            banner_color: `linear-gradient(${deg}deg, ${color1}, ${color2})`
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/settings/personalization', settings);
            notifySuccess(t('common.saved'));
        } catch (error) {
            notifyError(t('error.connection'));
        } finally {
            setIsSaving(false);
        }
    };

    const previewUser = user ? {
        ...user,
        personalization: {
            ...user.personalization,
            ...settings
        }
    } : null;

    if (isLoading) return <div className="socnet-loading">{t('common.loading')}</div>;

    return (
        <div className="socnet-settings-regular">
            <div className="socnet-settings-preview-wrapper" style={{ marginBottom: '25px' }}>
                <div className="socnet-preview-label">{t('common.preview')}</div>
                <UserProfileCard currentUser={previewUser} isPreview={true} forceTheme={uiTheme} />
            </div>

            <div className="socnet-settings-form">
                <h3>{t('settings.personalization_title')}</h3>

                <div className="socnet-form-group">
                    <label className="socnet-label">{t('settings.profile_theme')}</label>
                    <div className="socnet-theme-selector-grid">
                        <div
                            className={`socnet-theme-card ${uiTheme === 'modern' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('modern')}
                        >
                            <img src="/images/theme-modern.png" alt="modern" />
                            <div className="socnet-theme-card-label">{t('settings.theme_modern')}</div>
                        </div>
                        <div
                            className={`socnet-theme-card ${uiTheme === 'classic' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('classic')}
                        >
                            <img src="/images/theme-classic.png" alt="classic" />
                            <div className="socnet-theme-card-label">{t('settings.theme_classic')}</div>
                        </div>
                    </div>
                </div>

                <div className="socnet-form-group">
                    <label className="socnet-label">{t('settings.username_color')}</label>
                    <div className="socnet-color-picker-group">
                        <PopoverPicker
                            color={settings.username_color}
                            onChange={(color) => setSettings({ ...settings, username_color: color })}
                        />
                        <input
                            type="text"
                            className="socnet-input socnet-color-text-input"
                            placeholder={t('settings.color_placeholder')}
                            value={settings.username_color}
                            onChange={(e) => setSettings({ ...settings, username_color: e.target.value })}
                        />
                        <button
                            className="socnet-btn-ghost"
                            onClick={() => setSettings({ ...settings, username_color: '' })}
                        >
                            {t('common.reset')}
                        </button>
                    </div>
                    <small className="socnet-text-muted">{t('settings.username_color_hint')}</small>
                </div>

                <div className="socnet-form-group">
                    <label className="socnet-label">{t('settings.banner_color')}</label>

                    <div className="socnet-gradient-builder">
                        <div
                            className="socnet-gradient-preview"
                            style={{ background: `linear-gradient(${grad.deg}deg, ${grad.c1}, ${grad.c2})` }}
                        />

                        <div className="socnet-gradient-controls">
                            <div className="socnet-gradient-colors">
                                <PopoverPicker color={grad.c1} onChange={(c) => updateGradient(grad.deg, c, grad.c2)} />
                                <span className="socnet-gradient-icon">→</span>
                                <PopoverPicker color={grad.c2} onChange={(c) => updateGradient(grad.deg, grad.c1, c)} />
                            </div>

                            <div className="socnet-gradient-angle">
                                <label>{t('settings.angle')} ({grad.deg}°)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={grad.deg}
                                    onChange={(e) => updateGradient(e.target.value, grad.c1, grad.c2)}
                                    className="socnet-range-slider"
                                />
                            </div>
                        </div>
                    </div>
                    <small className="socnet-text-muted">{t('settings.banner_hint')}</small>
                </div>

                <button className="socnet-btn" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? t('common.loading') : t('common.save')}
                </button>
            </div>
        </div>
    );
}