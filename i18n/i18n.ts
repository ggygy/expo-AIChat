import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { translations } from './translations';

const i18n = new I18n(translations);

i18n.defaultLocale = 'en';
i18n.enableFallback = true;
i18n.locale = Localization.locale.split('-')[0];

export default i18n;
