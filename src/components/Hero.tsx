import { projects } from '../data/projects';
import { useLang } from '../i18n/LanguageProvider';

export default function Hero() {
  const { t } = useLang();
  return (
    <section className="hero">
      <h1 className="hero__headline">{t.hero.headline}</h1>
      <div className="hero__grid">
        <p className="hero__body">{t.hero.body}</p>
        <dl className="hero__meta">
          <div>{t.meta_count(projects.length)}</div>
          <div>{t.updated}</div>
        </dl>
      </div>
    </section>
  );
}
