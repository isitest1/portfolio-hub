import LanguageSwitcher from './LanguageSwitcher';

const CONTACT_EMAIL = 'kouhei10@gmail.com';

export default function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <span>© {new Date().getFullYear()} Kohei Ishikawa</span>
      <div className="site-footer__right">
        <a className="site-footer__contact" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        <a
          className="site-footer__contact"
          href="https://github.com/isitest1"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub
        </a>
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
