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
        <div className="tetrone-form-group" ref={dropdownRef}>
            <label className="tetrone-form-label">{t('common.country')}</label>

            <div className="tetrone-custom-select-wrapper">
                <div
                    className={`tetrone-form-select tetrone-custom-select ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selectedCountry ? (
                        <>
                            <span className={`fi fi-${selectedCountry.code.toLowerCase()} tetrone-flag`}></span>
                            <span>{selectedCountry.name}</span>
                        </>
                    ) : (
                        <span className="tetrone-select-placeholder">{t('settings.not_selected')}</span>
                    )}
                    
                    <span className="tetrone-select-arrow">
                        {isOpen ? '▲' : '▼'}
                    </span>
                </div>

                {isOpen && (
                    <ul className="tetrone-custom-dropdown-list">
                        <li
                            onClick={() => handleSelect(null)}
                            className="tetrone-custom-dropdown-item not-selected"
                        >
                            {t('settings.not_selected')}
                        </li>

                        {countries.map((c) => (
                            <li
                                key={c.code}
                                onClick={() => handleSelect(c.code)}
                                className={`tetrone-custom-dropdown-item ${value === c.code ? 'selected' : ''}`}
                            >
                                <span className={`fi fi-${c.code.toLowerCase()} tetrone-flag`}></span>
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