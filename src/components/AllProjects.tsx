import { groupOf, groupOrder, projects } from '../data/projects';
import { useLang } from '../i18n/LanguageProvider';
import ProjectLinks from './ProjectLinks';

export default function AllProjects() {
  const { lang, t } = useLang();
  return (
    <section className="section" id="products" aria-labelledby="all-heading">
      <h2 id="all-heading" className="eyebrow">
        {t.sections.all}
      </h2>
      <div className="columns">
        {groupOrder.map((key) => {
          const items = projects.filter((p) => groupOf(p) === key);
          if (items.length === 0) return null;
          return (
            <div key={key} className="column">
              <h3 className="column__head">{key}</h3>
              <ul className="column__list">
                {items.map((p) => (
                  <li key={p.id} className="row">
                    <div className="row__top">
                      <span className="row__name">{p.name}</span>
                      <span className="row__status">{t.status[p.status ?? 'active']}</span>
                    </div>
                    <p className="row__desc">{p.description[lang]}</p>
                    <ProjectLinks project={p} primaryOnly />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
