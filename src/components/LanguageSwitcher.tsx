import { useLang } from '../i18n/LanguageProvider';
import { ui } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang" role="group" aria-label={t.switchTo}>
      {(['ja', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          className="lang__btn"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          lang={l}
        >
          {l === 'ja' ? 'JA' : 'EN'}
          <span className="sr-only"> — {ui[l].langLabel}</span>
        </button>
      ))}
    </div>
  );
}
