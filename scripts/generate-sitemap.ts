import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { projects } from '../src/data/projects';
import { languages } from '../src/i18n/translations';

const SITE_URL = 'https://isitest1.github.io/portfolio-hub';

const urls: string[] = [];
for (const lang of languages) {
  urls.push(`${SITE_URL}/${lang}`);
  for (const p of projects) {
    if (p.hasDetailPage) urls.push(`${SITE_URL}/${lang}/projects/${p.id}`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
