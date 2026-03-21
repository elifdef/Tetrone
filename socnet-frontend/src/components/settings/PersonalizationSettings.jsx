import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import { AuthContext } from '../../context/AuthContext';
import PersonalizationService from '../../services/personalization.service';
import { notifySuccess, notifyError } from '../common/Notify';
import UserProfileCard from '../profile/UserProfileCard';
import ImageDropzone from './ImageDropzone';

const PopoverPicker = ({ color, onChange, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const safeHex = (color && color.startsWith('#')) ? color : '#ffffff';

    return (
        <div className="socnet-picker-container" ref={popoverRef}>
            <div
                className="socnet-custom-color-btn"
                style={{ backgroundColor: color || '#ffffff' }}
                onClick={() => setIsOpen(!isOpen)}
            />
            {isOpen && (
                <div className="socnet-color-popover">
                    <HexColorPicker
                        color={safeHex}
                        onChange={onChange}
                    />
                    <div className="socnet-color-input-wrapper">
                        <input
                            type="text"
                            className="socnet-input socnet-color-text-input"
                            value={color || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t('settings.color_format_hint')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default function PersonalizationSettings() {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [uiTheme, setUiTheme] = useState(localStorage.getItem('app_profile_theme') || 'modern');
    const [isDarkTheme, setIsDarkTheme] = useState(localStorage.getItem('dark_theme') !== 'false');

    const initialPersonalization = user?.personalization || {};

    const [settings, setSettings] = useState({
        banner_color: initialPersonalization.banner_color || '',
        username_color: initialPersonalization.username_color || '',
        banner_image: initialPersonalization.banner_image || null
    });

    const [bannerFile, setBannerFile] = useState(null);
    const [previewBannerImage, setPreviewBannerImage] = useState(initialPersonalization.banner_image || null);

    const [grad, setGrad] = useState({ deg: 0, c1: '#FFFFFF', c2: '#000000' });

    const parseGradient = useCallback((bc) => {
        if (!bc) return;
        const colors = bc.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g);
        const degMatch = bc.match(/(-?\d+)deg/);

        if (colors && colors.length >= 2) {
            setGrad({ deg: degMatch ? parseInt(degMatch[1]) : 135, c1: colors[0], c2: colors[1] });
        } else if (colors && colors.length === 1) {
            setGrad(prev => ({ ...prev, c1: colors[0], c2: colors[0] }));
        }
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            const res = await PersonalizationService.getSettings();
            if (res.success) {
                const resData = res.data?.personalization || {};
                const bc = resData.banner_color;

                setSettings({
                    banner_color: bc,
                    username_color: resData.username_color || '',
                    banner_image: resData.banner_image || null
                });
                setPreviewBannerImage(resData.banner_image || null);

                if (bc) {
                    parseGradient(bc);
                }
            } else {
                notifyError(res.message);
            }
            setIsLoading(false);
        };

        fetchSettings();
    }, [parseGradient]);

    const handleProfileThemeChange = (newTheme) => {
        setUiTheme(newTheme);
        localStorage.setItem('app_profile_theme', newTheme);
        window.dispatchEvent(new Event('theme_changed'));
    };

    const handleGlobalThemeToggle = () => {
        const newVal = !isDarkTheme;
        setIsDarkTheme(newVal);
        localStorage.setItem('dark_theme', newVal ? 'true' : 'false');

        if (!newVal) {
            document.body.setAttribute('data-theme', 'light');
        } else {
            document.body.removeAttribute('data-theme');
        }
    };

    const updateGradient = (deg, color1, color2) => {
        setGrad({ deg, c1: color1, c2: color2 });
        setSettings(prev => ({
            ...prev,
            banner_color: `linear-gradient(${deg}deg, ${color1}, ${color2})`
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBannerFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewBannerImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setBannerFile(null);
        setPreviewBannerImage(null);

        setSettings(prev => ({
            ...prev,
            banner_image: null,
            banner_color: prev.banner_color
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();

        formData.append('username_color', settings.username_color || '');
        formData.append('banner_color', settings.banner_color || '');

        if (bannerFile) {
            formData.append('banner_image', bannerFile);
        } else if (previewBannerImage === null) {
            formData.append('remove_banner_image', 'true');
        }

        const res = await PersonalizationService.updateSettings(formData);

        if (res.success) {
            if (setUser && res.data?.personalization) {
                setUser({ ...user, personalization: res.data.personalization });
            }
            notifySuccess(res.message);
        } else {
            notifyError(res.message);
        }
        setIsSaving(false);
    };

    const previewUser = user ? {
        ...user,
        personalization: {
            ...user.personalization,
            ...settings,
            banner_image: previewBannerImage
        }
    } : null;

    if (isLoading) return <div className="socnet-loading">{t('common.loading')}</div>;

    const themeSuffix = isDarkTheme ? 'dark' : 'light';

    return (
        <div className="socnet-settings-regular">
            <div className="socnet-settings-preview-wrapper">
                <div className="socnet-preview-label">{t('common.preview')}</div>
                <UserProfileCard currentUser={previewUser} isPreview={true} forceTheme={uiTheme} />
            </div>

            <div className="socnet-settings-form">
                <div className="socnet-settings-header-row">
                    <h3 className="socnet-settings-title">{t('settings.personalization_title')}</h3>

                    <button
                        className="socnet-btn-ghost socnet-theme-toggle-btn"
                        onClick={handleGlobalThemeToggle}
                    >
                        {isDarkTheme ? t('settings.theme_light') : t('settings.theme_dark')}
                    </button>
                </div>

                <div className="socnet-form-group">
                    <label className="socnet-label">{t('settings.profile_theme')}</label>
                    <div className="socnet-theme-selector-grid">
                        <div
                            className={`socnet-theme-card ${uiTheme === 'modern' ? 'active' : ''}`}
                            onClick={() => handleProfileThemeChange('modern')}
                        >
                            <img
                                src={`/images/theme-modern-${themeSuffix}.png`}
                                alt="modern"
                                className="socnet-theme-img"
                            />
                            <div className="socnet-theme-card-label">{t('settings.theme_modern')}</div>
                        </div>
                        <div
                            className={`socnet-theme-card ${uiTheme === 'classic' ? 'active' : ''}`}
                            onClick={() => handleProfileThemeChange('classic')}
                        >
                            <img
                                src={`/images/theme-classic-${themeSuffix}.png`}
                                alt="classic"
                                className="socnet-theme-img"
                            />
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
                            t={t}
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

                {uiTheme === 'modern' && (
                    <div className="socnet-form-group">
                        <label className="socnet-label">{t('settings.banner_background')}</label>

                        <div className="socnet-banner-upload-box">
                            <ImageDropzone
                                onFileSelect={handleImageChange}
                                previewImage={previewBannerImage}
                                onRemove={handleRemoveImage}
                            />

                            {previewBannerImage && (
                                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        className="socnet-btn-ghost danger"
                                        onClick={handleRemoveImage}
                                    >
                                        {t('common.delete')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="socnet-gradient-builder" style={{ marginTop: '15px' }}>
                            <div
                                className="socnet-gradient-preview"
                                style={{ background: settings.banner_color || `linear-gradient(${grad.deg}deg, ${grad.c1}, ${grad.c2})` }}
                            />

                            <div className="socnet-gradient-controls">
                                <div className="socnet-gradient-colors">
                                    <PopoverPicker color={grad.c1} onChange={(c) => updateGradient(grad.deg, c, grad.c2)} t={t} />
                                    <span className="socnet-gradient-icon">→</span>
                                    <PopoverPicker color={grad.c2} onChange={(c) => updateGradient(grad.deg, grad.c1, c)} t={t} />
                                </div>

                                <div className="socnet-gradient-angle">
                                    <label className="socnet-angle-label">
                                        {t('settings.angle')} ({grad.deg}°)
                                    </label>
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
                )}

                <button className="socnet-btn" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? t('common.loading') : t('common.save')}
                </button>
            </div>
        </div>
    );
}