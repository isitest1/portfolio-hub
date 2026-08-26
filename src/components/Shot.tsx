import type { Project } from '../types';

/** 画像が未登録のときは、何を置くかを書いたプレースホルダを表示する */
export default function Shot({ project, height = 240 }: { project: Project; height?: number }) {
  const src = project.screenshots?.[0];
  if (src) {
    return <img className="shot" src={src} alt={project.name} height={height} loading="lazy" />;
  }
  return (
    <div className="shot shot--empty" style={{ height }} aria-hidden="true">
      <span>{project.id} / screenshot</span>
    </div>
  );
}
