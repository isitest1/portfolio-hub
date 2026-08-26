import About from '../components/About';
import AllProjects from '../components/AllProjects';
import Featured from '../components/Featured';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Hero from '../components/Hero';
import { useLang } from '../i18n/LanguageProvider';
import { useSeo } from '../i18n/seo';

export default function Home() {
  const { t } = useLang();
  useSeo(t.meta.title, t.meta.description);

  return (
    <div className="page">
      <Header />
      <main>
        <Hero />
        <Featured />
        <AllProjects />
        <About />
      </main>
      <Footer />
    </div>
  );
}
