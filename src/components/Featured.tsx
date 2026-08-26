import { featuredProjects } from '../data/projects';
import { useLang } from '../i18n/LanguageProvider';
import ProjectLinks from './ProjectLinks';
import Shot from './Shot';

export default function Featured() {
  const { lang, t } = useLang();
  const items = featuredProjects();
  if (items.length === 0) return null;

  return (
    <section className="section section--featured" aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="eyebrow eyebrow--accent">
        {t.sections.featured}
      </h2>
      <div className="featured-grid">
        {items.map((p) => (
          <article key={p.id} className="fcard">
            <Shot project={p} alt={p.name[lang]} height={300} />
            <div className="fcard__body">
              <span className="fcard__cat">{p.category}</span>
              <h3 className="fcard__name">{p.name[lang]}</h3>
              <p className="fcard__desc">{p.description[lang]}</p>
              <ProjectLinks project={p} primaryOnly />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
