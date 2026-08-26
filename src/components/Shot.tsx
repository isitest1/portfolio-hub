import type { Project } from '../types';

/** 画像が未登録のときは、何を置くかを書いたプレースホルダを表示する */
export default function Shot({
  project,
  height = 240,
  fit = 'cover',
}: {
  project: Project;
  height?: number;
  /** cover: グリッドカードで高さを揃えて上部をクロップ。contain: 詳細ページで全体を見せる */
  fit?: 'cover' | 'contain';
}) {
  const src = project.screenshots?.[0];
  if (src) {
    // public/ 配下の絶対パスは GitHub Pages の base（/portfolio-hub/）を通す必要がある
    const resolvedSrc = import.meta.env.BASE_URL.replace(/\/$/, '') + src;
    return (
      <img className={`shot shot--${fit}`} src={resolvedSrc} alt={project.name} height={height} loading="lazy" />
    );
  }
  return (
    <div className="shot shot--empty" style={{ height }} aria-hidden="true">
      <span>{project.id} / screenshot</span>
    </div>
  );
}
