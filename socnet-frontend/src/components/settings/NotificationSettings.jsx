import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import notificationService from '../../services/notification.service';
import { notifySuccess, notifyError } from '../common/Notify';

const SOUND_OPTIONS = [
    { value: '', label: 'settings.sounds.default' },
    { value: 'none', label: 'settings.sounds.silent' },
    { value: 'custom_url', label: 'settings.sounds.custom_url' },
    { value: 'custom_file', label: 'settings.sounds.custom_file' }
];

const SETTING_ITEMS = [
    { type: 'messages', labelKey: 'settings.notification_messages' },
    { type: 'likes', labelKey: 'settings.notification_likes' },
    { type: 'comments', labelKey: 'settings.notification_comments' },
    { type: 'reposts', labelKey: 'settings.notification_reposts' },
    { type: 'wall_posts', labelKey: 'settings.notification_wall_posts' },
    { type: 'friend_requests', labelKey: 'settings.notification_friend_requests' }
];

const NotificationSettings = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState(null);
    const [files, setFiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [playingKey, setPlayingKey] = useState(null);
    const audioRef = useRef(new Audio());
    const fileInputRefs = useRef({});

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setPlayingKey(null);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            const res = await notificationService.getSettings();
            if (res.success) {
                const formattedData = { ...(res.data || {}) };

                Object.keys(formattedData).forEach(key => {
                    if (formattedData[key] === null) formattedData[key] = '';
                    if (key.startsWith('sound_') && typeof formattedData[key] === 'string' && formattedData[key].startsWith('http')) {
                        formattedData[`${key}_input`] = formattedData[key];
                    }
                });

                setSettings(formattedData);
            } else {
                notifyError(res.message);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [t]);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSoundTypeChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        if (value !== 'custom_file') {
            setFiles(prev => {
                const newFiles = { ...prev };
                delete newFiles[key];
                return newFiles;
            });
        }

        if (value === 'custom_file' && fileInputRefs.current[key]) {
            setTimeout(() => {
                if (fileInputRefs.current[key]) {
                    fileInputRefs.current[key].click();
                }
            }, 50);
        }

        if (playingKey === key.replace('sound_', '')) {
            audioRef.current.pause();
            setPlayingKey(null);
        }
    };

    const handleFileChange = (key, e) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [key]: file }));
        }
    };

    const handleUrlChange = (key, value) => {
        setSettings(prev => ({ ...prev, [`${key}_input`]: value }));
    };

    const getSelectValue = (soundKey) => {
        const val = settings[soundKey];
        if (!val) return '';
        if (val === 'custom_file' || val === 'custom_url') return val;
        if (typeof val === 'string' && val.startsWith('http')) {
            return val.includes('/notifications/') ? 'custom_file' : 'custom_url';
        }
        return val;
    };

    const handlePlaySound = (typeKey) => {
        const soundKey = `sound_${typeKey}`;

        if (playingKey === typeKey) {
            audioRef.current.pause();
            setPlayingKey(null);
            return;
        }

        const currentType = getSelectValue(soundKey);
        if (currentType === 'none') return;

        let urlToPlay = '';

        if (currentType === 'custom_file') {
            urlToPlay = files[soundKey] ? URL.createObjectURL(files[soundKey]) : settings[soundKey];
        } else if (currentType === 'custom_url') {
            urlToPlay = settings[`${soundKey}_input`] || settings[soundKey];
        } else {
            const fileName = currentType === '' ? 'faaah.mp3' : currentType;
            urlToPlay = `/sounds/${fileName}`;
        }

        if (urlToPlay && typeof urlToPlay === 'string' && urlToPlay.length > 5) {
            audioRef.current.pause();
            audioRef.current.src = urlToPlay;

            audioRef.current.play()
                .then(() => {
                    setPlayingKey(typeKey);
                    setTimeout(() => {
                        if (audioRef.current && !audioRef.current.paused) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                            setPlayingKey(null);
                        }
                    }, 5000);
                })
                .catch(err => {
                    // console.error("Помилка відтворення:", err);
                    notifyError("Неможливо відтворити цей файл/посилання");
                    setPlayingKey(null);
                });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        formData.append('_method', 'PUT');

        SETTING_ITEMS.forEach(({ type }) => {
            const notifyKey = `notify_${type}`;
            const soundKey = `sound_${type}`;

            formData.append(notifyKey, settings[notifyKey] ? '1' : '0');

            const currentType = getSelectValue(soundKey);

            if (currentType === 'custom_file' && files[soundKey]) {
                formData.append(soundKey, files[soundKey]);
            } else if (currentType === 'custom_url') {
                formData.append(soundKey, settings[`${soundKey}_input`] || '');
            } else {
                formData.append(soundKey, settings[soundKey] || '');
            }
        });

        const res = await notificationService.updateSettings(formData);

        if (res.success) {
            const formattedData = { ...(res.data?.settings || res.data || {}) };
            Object.keys(formattedData).forEach(key => {
                if (formattedData[key] === null) formattedData[key] = '';
                if (key.startsWith('sound_') && formattedData[key].startsWith('http')) {
                    formattedData[`${key}_input`] = formattedData[key];
                }
            });
            setSettings(formattedData);
            setFiles({});
            notifySuccess(res.message);
        } else {
            notifyError(res.message);
        }
        setSaving(false);
    };

    const getDisplayFileName = (soundKey) => {
        if (files[soundKey]) {
            return files[soundKey].name;
        }
        if (settings[soundKey] && settings[soundKey].includes('/notifications/')) {
            return settings[soundKey].split('/').pop();
        }
        return t('common.no_file_selected');
    };

    if (loading) return <div className="settings-loading">{t('common.loading')}</div>;
    if (!settings) return null;

    return (
        <div className="tetrone-settings-section">
            <div className="notification-settings-list">
                {SETTING_ITEMS.map(({ type, labelKey }) => {
                    const notifyKey = `notify_${type}`;
                    const soundKey = `sound_${type}`;
                    const isEnabled = settings[notifyKey];
                    const currentSelectValue = getSelectValue(soundKey);
                    const isPlaying = playingKey === type;

                    return (
                        <div key={type} className="notification-setting-row">
                            <label className="setting-info">
                                <input
                                    type="checkbox"
                                    className="tetrone-checkbox"
                                    checked={isEnabled}
                                    onChange={() => handleToggle(notifyKey)}
                                />
                                <span className="setting-label">{t(labelKey)}</span>
                            </label>

                            {isEnabled && (
                                <div className="setting-controls">
                                    <select
                                        className="tetrone-select sound-select"
                                        value={currentSelectValue}
                                        onChange={(e) => handleSoundTypeChange(soundKey, e.target.value)}
                                    >
                                        {SOUND_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {t(option.label)}
                                            </option>
                                        ))}
                                    </select>

                                    {currentSelectValue === 'custom_url' && (
                                        <input
                                            type="text"
                                            className="tetrone-form-input"
                                            placeholder="https://..."
                                            style={{ width: '200px' }}
                                            value={settings[`${soundKey}_input`] || ''}
                                            onChange={(e) => handleUrlChange(soundKey, e.target.value)}
                                        />
                                    )}

                                    {currentSelectValue === 'custom_file' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                style={{ display: 'none' }}
                                                ref={(el) => fileInputRefs.current[soundKey] = el}
                                                onChange={(e) => handleFileChange(soundKey, e)}
                                            />

                                            <button
                                                type="button"
                                                className="tetrone-btn btn-small"
                                                onClick={() => fileInputRefs.current[soundKey]?.click()}
                                            >
                                                {t('common.browse')}
                                            </button>

                                            <span
                                                className="tetrone-avatar-file-name"
                                                style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                title={getDisplayFileName(soundKey)}
                                            >
                                                {getDisplayFileName(soundKey)}
                                            </span>
                                        </div>
                                    )}

                                    {currentSelectValue !== 'none' && (
                                        <button
                                            type="button"
                                            className="tetrone-btn btn-small"
                                            onClick={() => handlePlaySound(type)}
                                            title={isPlaying ? "Пауза" : t('common.play_sound')}
                                        >
                                            {isPlaying ? '⏸' : '▶'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="settings-actions" style={{ marginTop: '20px' }}>
                <button
                    className="tetrone-btn-save"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? t('common.saving') : t('common.save')}
                </button>
            </div>
        </div>
    );
};

export default NotificationSettings;