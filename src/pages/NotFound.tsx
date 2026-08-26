import { Link } from 'react-router-dom';
import { detectLang } from '../i18n/LanguageProvider';
import { ui } from '../i18n/translations';

export default function NotFound() {
  const lang = detectLang();
  const t = ui[lang];
  return (
    <div className="page">
      <main className="section">
        <h1 className="detail__name">{t.notFound.title}</h1>
        <p className="about__body">{t.notFound.body}</p>
        <Link className="links__item" to={'/' + lang}>
          {t.notFound.cta} <span aria-hidden="true">→</span>
        </Link>
      </main>
    </div>
  );
}
