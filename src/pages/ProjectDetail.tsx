import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProjectLinks from '../components/ProjectLinks';
import Shot from '../components/Shot';
import { projects } from '../data/projects';
import { useLang } from '../i18n/LanguageProvider';
import { absoluteUrl, useJsonLd, useSeo } from '../i18n/seo';

export default function ProjectDetail() {
  const { id } = useParams();
  const { lang, t, path } = useLang();
  const project = projects.find((p) => p.id === id);

  useSeo(
    project ? `${project.name} — Portfolio Hub` : t.notFound.title,
    project ? project.description[lang] : t.notFound.body
  );

  const jsonLd = project
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: project.name,
        description: (project.longDescription ?? project.description)[lang],
        url: project.appStoreUrl ?? project.websiteUrl ?? absoluteUrl(path('projects/' + project.id)),
        image: project.screenshots?.[0] ? absoluteUrl(project.screenshots[0]) : undefined,
        applicationCategory: project.category === 'iOS' ? 'MobileApplication' : 'WebApplication',
        operatingSystem: project.platforms?.join(', '),
        author: { '@type': 'Person', name: 'Kohei Ishikawa' },
      })
    : null;
  useJsonLd(jsonLd);

  if (!project) {
    return (
      <div className="page">
        <Header />
        <main className="section">
          <h1 className="detail__name">{t.notFound.title}</h1>
          <p className="about__body">{t.notFound.body}</p>
          <Link className="links__item" to={path()}>
            {t.notFound.cta} <span aria-hidden="true">→</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main>
        <section className="section detail">
          <Link className="detail__back" to={path()}>
            <span aria-hidden="true">←</span> {t.links.back}
          </Link>
          <span className="fcard__cat">{project.category}</span>
          <h1 className="detail__name">{project.name}</h1>
          <p className="detail__lead">{project.description[lang]}</p>
          <ProjectLinks project={project} />
        </section>

        <section className="section detail__grid">
          <div>
            <h2 className="column__head">{t.detail.overview}</h2>
            <p className="about__body">{(project.longDescription ?? project.description)[lang]}</p>

            {project.features && project.features.length > 0 && (
              <>
                <h2 className="column__head detail__subhead">{t.detail.features}</h2>
                <ul className="feature-list">
                  {project.features.map((fe) => (
                    <li key={fe.en}>{fe[lang]}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <aside className="detail__aside">
            {project.platforms && (
              <div>
                <h2 className="column__head">{t.detail.platforms}</h2>
                <p className="mono">{project.platforms.join(' · ')}</p>
              </div>
            )}
            {project.technologies && (
              <div>
                <h2 className="column__head">{t.detail.tech}</h2>
                <p className="mono">{project.technologies.join(' · ')}</p>
              </div>
            )}
          </aside>
        </section>

        <section className="section">
          <h2 className="eyebrow">{t.detail.screenshots}</h2>
          <Shot project={project} height={560} fit="contain" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
