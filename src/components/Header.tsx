import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { t, path } = useLang();
  return (
    <header className="site-header">
      <Link to={path()} className="wordmark">
        PORTFOLIO HUB
      </Link>
      <nav className="site-nav" aria-label={t.nav.products}>
        <a href="#products">{t.nav.products}</a>
        <a href="#about">{t.nav.about}</a>
        <a href="#footer">{t.nav.contact}</a>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
