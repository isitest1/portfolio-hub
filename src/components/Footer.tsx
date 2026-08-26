import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <span>© {new Date().getFullYear()} Portfolio Hub</span>
      <div className="site-footer__right">
        {/* githubUrl / contact は実URLが決まったら設定する */}
        <LanguageSwitcher />
      </div>
    </footer>
  );
}
