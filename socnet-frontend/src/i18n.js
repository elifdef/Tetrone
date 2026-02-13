import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import isoCountries from "i18n-iso-countries";

import uk from './locales/uk.json';
import en from './locales/en.json';

import isoEn from "i18n-iso-countries/langs/en.json";
import isoUk from "i18n-iso-countries/langs/uk.json";

isoCountries.registerLocale(isoEn);
isoCountries.registerLocale(isoUk);

export const getSystemLanguage = () => {
    const saved = localStorage.getItem('lang');
    if (saved) 
        return saved;

    const rawLang = navigator.language || navigator.userLanguage || 'en';
    return rawLang.split('-')[0];
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            uk: { translation: uk }
        },
        lng: getSystemLanguage(),
        fallbackLng: "en",
        load: 'languageOnly',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;