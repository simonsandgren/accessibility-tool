# Tillgänglighetsgranskningsplugin – Kravdokument

## Koncept / idé

Ett browser-tillägg (Chrome-extension) för manuella tillgänglighetsgranskningar. När det aktiveras fälls en panel ut i webbläsaren, ungefär som Chrome DevTools. Panelen innehåller kontroller för att:

1. **Exponera** strukturell information i sidans gränssnitt (alt-texter, rubriknivåer, landmärken, ARIA-roller, fokusordning) genom visuella overlays/badges.
2. **Manipulera** sidans presentation (textstorlek, radavstånd, teckenavstånd, möjlighet att stänga av sidans egen CSS) för att testa hur sidan beter sig under olika förhållanden, relevant för WCAG-kriterier som text spacing (1.4.12).

Verktyget är ett **exponeringsverktyg, inte ett bedömningsverktyg**. Det gör inga automatiska bedömningar av fel eller brister – all bedömning görs av användaren. Detta är ett medvetet designval som förenklar scope och gör verktyget robust över tid (inget behov av att underhålla en regelbok över WCAG-kriterier).

Primärt syfte: eget bruk i professionella tillgänglighetsgranskningar. Sekundärt syfte: om verktyget blir stabilt och särskiljer sig tillräckligt från befintliga verktyg (axe DevTools, WAVE, Accessibility Insights for Web), kan det publiceras för andra.

## Avgränsningar (medvetna beslut)

| Aspekt | Beslut | Motivering |
|---|---|---|
| Iframes | Exkluderas i v1 | Begränsade av webbläsarens säkerhetsmodell (cross-origin), hög komplexitet i förhållande till nytta just nu |
| Shadow DOM | Inkluderas | Vanligt i moderna komponentbibliotek, hanterbart med öppna shadow roots |
| Permissions | `activeTab` | Inget behov av bakgrundskörning på alla sidor; enklare, snabbare, inget granskningskrav vid ev. publicering |
| Felbedömning | Görs aldrig av verktyget | Användaren gör alla bedömningar; verktyget exponerar bara |
| Hosting | Lokal "Load unpacked" i v1 | Inget behov av Chrome Web Store-publicering förrän verktyget är stabilt |

## Funktionella krav

### Panel (huvudgränssnitt)
- Fälls ut i webbläsaren vid aktivering (klick på extension-ikon), liknande DevTools.
- Byggs med semantisk, tillgänglig HTML (riktiga `<button>`, `<input>` etc.) – panelen ska själv vara fullt tillgänglig via tangentbord och skärmläsare.
- Innehåller på/av-kontroller (toggles) för varje exponeringsfunktion nedan.
- Manuell "uppdatera"-knapp som komplement till automatisk uppdatering.

### Exponeringsfunktioner
- **Alt-texter**: visa alt-attribut som overlay/badge på bilder; flagga bilder utan alt-attribut (utan att bedöma om text saknas är ett "fel").
- **Rubriknivåer**: visualisera h1–h6-strukturen som overlay, t.ex. nivå-nummer ovanpå varje rubrik.
- **Landmärken**: visa `<nav>`, `<main>`, `<header>`, `<footer>`, `role="..."` etc. som overlay/ram runt elementet.
- **ARIA-roller/attribut**: generell visning av relevanta ARIA-attribut på element.
- **Fokusordning**: visualisera tabbordning (tab stops) för fokuserbara element, inklusive numrering/linje mellan dem; ta hänsyn till `tabindex`.
- **Shadow DOM**: traversering ska öppna och inkludera öppna shadow roots i alla ovanstående funktioner.

### Manipulationsfunktioner
- **Textstorlek**: reglage för att öka/minska textstorlek globalt på sidan.
- **Radavstånd** (line-height): reglage för att justera.
- **Teckenavstånd** (letter-spacing): reglage för att justera.
- **Stäng av sidans CSS**: möjlighet att inaktivera samtliga stylesheets (`<link>` och `<style>`) för att testa sidans struktur utan visuell styling.
- **Konflikthantering**: om en manipulation inte slår igenom (verifierat via `getComputedStyle()` jämfört med avsedt värde), visa en varning i panelen som anger vilka/hur många element som inte påverkades.

### Teknisk uppdateringsmodell
- Initial skanning av DOM vid panelaktivering.
- Löpande uppdatering via `MutationObserver` för att fånga dynamiskt innehåll (SPA-beteende).
- Manuell uppdateringsknapp som fallback.

## Icke-funktionella krav
- Panelen själv ska uppfylla WCAG på rimlig nivå (tangentbordsnavigerbar, korrekt semantik, synlig fokusindikator).
- Ska fungera utan extern serverkommunikation (allt körs lokalt i webbläsaren).
- Prestanda: `MutationObserver` ska inte orsaka märkbar fördröjning på sidor med mycket DOM-aktivitet.

## Explicit utanför scope (v1)
- Automatisk felidentifiering eller WCAG-regelefterlevnadskontroll.
- Stöd för iframes.
- Exportfunktion för granskningsrapporter (kan läggas till senare).
- Publicering i Chrome Web Store / bred `host_permissions`.

## Öppna frågor för senare iteration
- Exportformat för ev. rapportfunktion.
- Hantering av inline-styles som skrivs över av sidans egen JavaScript (kan kräva `MutationObserver` på `style`-attribut).
- Eventuellt stöd för iframes om behov uppstår.
