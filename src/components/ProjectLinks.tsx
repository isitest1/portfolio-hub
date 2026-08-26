import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { useLang } from '../i18n/LanguageProvider';

/** 存在するリンクだけを優先順位どおりに描画する */
export default function ProjectLinks({ project, primaryOnly = false }: { project: Project; primaryOnly?: boolean }) {
  const { t, path } = useLang();
  const items: { label: string; href?: string; to?: string }[] = [];

  if (project.appStoreUrl) items.push({ label: t.links.appStore, href: project.appStoreUrl });
  if (project.websiteUrl) items.push({ label: t.links.website, href: project.websiteUrl });
  if (project.hasDetailPage) items.push({ label: t.links.detail, to: path('projects/' + project.id) });
  if (project.supportUrl) items.push({ label: t.links.support, href: project.supportUrl });
  if (project.githubUrl) items.push({ label: t.links.github, href: project.githubUrl });
  if (project.documentationUrl) items.push({ label: t.links.docs, href: project.documentationUrl });

  if (items.length === 0) return null;
  const list = primaryOnly ? items.slice(0, 1) : items;

  return (
    <div className={primaryOnly ? 'links links--primary' : 'links'}>
      {list.map((i) =>
        i.to ? (
          <Link key={i.label} to={i.to} className="links__item">
            {i.label} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <a key={i.label} href={i.href} className="links__item" target="_blank" rel="noreferrer noopener">
            {i.label} <span aria-hidden="true">↗</span>
          </a>
        )
      )}
    </div>
  );
}
