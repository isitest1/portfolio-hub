import { useLang } from '../i18n/LanguageProvider';

export default function About() {
  const { t } = useLang();
  return (
    <section className="section about" id="about" aria-labelledby="about-heading">
      <h2 id="about-heading" className="column__head">
        {t.sections.about}
      </h2>
      <p className="about__body">{t.about}</p>
    </section>
  );
}
