//@ts-nocheck
import i18next from 'i18next';
import English from './English.json';
import Urdu from './Urdu.json';
import RomanUrdu from './RomanUrdu.json';
import { initReactI18next } from 'react-i18next';
import { StorageManager } from '../services'
import { Platform } from 'react-native';
const { getData, storageKeys, setData } = StorageManager


const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (language: any) => {
        getData(storageKeys.LANGUAGE).then((data) => {
            if (data) {
                return language(data);
            }
            else {
                return language("en")
            }
        })
            .catch(() => "en")
    },
    init: () => { },

    cacheUserLanguage: (locale: any) => {
        setData(storageKeys.LANGUAGE, locale)
    }

};

i18next
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources: {
            en: English,
            ur: Urdu,
            rur: RomanUrdu
        },
        react: {
            useSuspense: false
        }
    });


export default i18next