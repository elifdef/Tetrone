import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import isoCountries from "i18n-iso-countries";
import "flag-icons/css/flag-icons.min.css";

const CountrySelect = ({ value, onChange }) => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const countries = useMemo(() => {
        const langCode = i18n.language;
        const countriesObj = isoCountries.getNames(langCode, { select: "official" })
            || isoCountries.getNames('en', { select: "official" });

        return Object.entries(countriesObj)
            .map(([code, name]) => ({ code, name }))
            .sort((a, b) => a.name.localeCompare(b.name));

    }, [i18n.language]);

    const selectedCountry = countries.find(c => c.code === value);

    const handleSelect = (code) => {
        onChange({
            target: {
                name: 'country',
                value: code
            }
        });
        setIsOpen(false);
    };

    return (
        <div className="vk-form-group" ref={dropdownRef}>
            <label className="vk-form-label">{t('common.country')}</label>

            <div style={{ position: 'relative' }}>
                <div
                    className="vk-form-select vk-custom-select"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        gap: '10px',
                        borderColor: isOpen ? 'var(--theme-link)' : 'var(--theme-input-border)'
                    }}
                >
                    {selectedCountry ? (
                        <>
                            <span className={`fi fi-${selectedCountry.code.toLowerCase()}`} style={{ borderRadius: '2px' }}></span>
                            <span>{selectedCountry.name}</span>
                        </>
                    ) : (
                        <span style={{ color: 'var(--theme-text-muted)' }}>{t('settings.not_selected')}</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--theme-text-muted)' }}>
                        {isOpen ? '▲' : '▼'}
                    </span>
                </div>

                {isOpen && (
                    <ul className="vk-custom-dropdown-list">
                        <li
                            onClick={() => handleSelect(null)}
                            className="vk-custom-dropdown-item not-selected"
                        >
                            {t('settings.not_selected')}
                        </li>

                        {countries.map((c) => (
                            <li
                                key={c.code}
                                onClick={() => handleSelect(c.code)}
                                className={`vk-custom-dropdown-item ${value === c.code ? 'selected' : ''}`}
                            >
                                <span className={`fi fi-${c.code.toLowerCase()}`} style={{ borderRadius: '2px' }}></span>
                                <span>{c.name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CountrySelect;