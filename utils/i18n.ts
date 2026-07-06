export type Language = 'en' | 'sv';

const dictionaries: Record<Language, Record<string, string>> = {
  en: {
    panelTitle: 'Accessibility Audit Panel',
    exposureLegend: 'Exposure',
    manipulationLegend: 'Manipulation',
    headingLevelsLabel: 'Heading levels',
    disableCssLabel: 'Disable page CSS',
    refreshButton: 'Refresh',
    settingsLabel: 'Settings',
    languageLabel: 'Language',
    languageAuto: 'Auto (browser language)',
    statusNoActiveTab: 'No active tab found.',
    statusUnreachable: 'Could not reach this page. Click the extension icon again to re-activate it.',
    'statusHeadingsShown.one': 'Showing {count} heading.',
    'statusHeadingsShown.other': 'Showing {count} headings.',
    statusHeadingsHidden: 'Heading levels hidden.',
    'statusCssDisabled.one': 'Page CSS disabled ({count} stylesheet).',
    'statusCssDisabled.other': 'Page CSS disabled ({count} stylesheets).',
    statusCssEnabled: 'Page CSS re-enabled.',
    'statusRefreshed.one': 'Refreshed: {count} heading found.',
    'statusRefreshed.other': 'Refreshed: {count} headings found.',
  },
  sv: {
    panelTitle: 'Panel för tillgänglighetsgranskning',
    exposureLegend: 'Exponering',
    manipulationLegend: 'Manipulation',
    headingLevelsLabel: 'Rubriknivåer',
    disableCssLabel: 'Inaktivera sidans CSS',
    refreshButton: 'Uppdatera',
    settingsLabel: 'Inställningar',
    languageLabel: 'Språk',
    languageAuto: 'Auto (webbläsarens språk)',
    statusNoActiveTab: 'Ingen aktiv flik hittades.',
    statusUnreachable: 'Kunde inte nå sidan. Klicka på tilläggsikonen igen för att återaktivera den.',
    'statusHeadingsShown.one': 'Visar {count} rubrik.',
    'statusHeadingsShown.other': 'Visar {count} rubriker.',
    statusHeadingsHidden: 'Rubriknivåer dolda.',
    'statusCssDisabled.one': 'Sidans CSS inaktiverad ({count} stilmall).',
    'statusCssDisabled.other': 'Sidans CSS inaktiverad ({count} stilmallar).',
    statusCssEnabled: 'Sidans CSS återaktiverad.',
    'statusRefreshed.one': 'Uppdaterat: {count} rubrik hittades.',
    'statusRefreshed.other': 'Uppdaterat: {count} rubriker hittades.',
  },
};

function detectBrowserLanguage(): Language {
  const lang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return lang === 'sv' ? 'sv' : 'en';
}

let currentLanguage: Language = detectBrowserLanguage();

/** Override the resolved language, or pass 'auto' to go back to the browser's language. */
export function setLanguageOverride(language: Language | 'auto') {
  currentLanguage = language === 'auto' ? detectBrowserLanguage() : language;
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const text = dictionaries[currentLanguage]?.[key] ?? dictionaries.en[key] ?? key;
  if (!vars) return text;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), text);
}

/** Like `t`, but picks the right plural form of `baseKey` (e.g. "key.one" / "key.other") for `count`. */
export function tCount(baseKey: string, count: number, vars?: Record<string, string | number>): string {
  const rule = new Intl.PluralRules(currentLanguage).select(count);
  return t(`${baseKey}.${rule}`, { count, ...vars });
}
