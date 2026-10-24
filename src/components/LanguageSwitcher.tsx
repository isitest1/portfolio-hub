import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LanguageProvider';
import { ui } from '../i18n/translations';

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const { pathname } = useLocation();
  // 同じページの別言語版（/ja/projects/x → /en/projects/x）
  const rest = pathname.replace(/^\/(ja|en)/, '');
  return (
    <nav className="lang" aria-label={t.switchTo}>
      {(['ja', 'en'] as const).map((l) => (
        <Link
          key={l}
          to={'/' + l + rest}
          replace
          className="lang__btn"
          aria-current={lang === l ? 'page' : undefined}
          onClick={() => setLang(l)}
          hrefLang={l}
          lang={l}
        >
          {l === 'ja' ? 'JA' : 'EN'}
          <span className="sr-only"> — {ui[l].langLabel}</span>
        </Link>
      ))}
    </nav>
  );
}
