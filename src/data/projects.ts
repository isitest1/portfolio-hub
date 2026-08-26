import type { Project } from '../types';

/**
 * プロジェクトを追加する手順:
 *  1. public/projects/ に画像を置く（任意）
 *  2. この配列に 1 件追加する
 *  3. ja / en の説明を書く
 *  4. 実在する URL のみ設定する（不明なキーは書かない）
 *  5. 必要なら featured: true / hasDetailPage: true
 * コンポーネント側の修正は不要。
 */
export const projects: Project[] = [
  {
    id: 'needsoon',
    name: 'NeedSoon',
    category: 'iOS',
    featured: true,
    status: 'active',
    technologies: ['Swift', 'SwiftUI', 'CloudKit'],
    platforms: ['iPhone', 'iPad'],
    hasDetailPage: true,
    description: {
      ja: '買い物リストと家の在庫を一つにまとめて、切らす前に気づけるようにするiPhoneアプリ。',
      en: 'Shopping list and home inventory in one place, so you notice before you run out.',
    },
    longDescription: {
      ja: '「あれ、もう無い」を減らすためのアプリです。在庫と買い物リストが同じ画面でつながっているので、使い切ったその場でリストに送れます。',
      en: 'Built to remove the moment you discover something has run out. Inventory and list live on the same screen, so an empty box becomes a list item in one tap.',
    },
    features: [
      { ja: '在庫からワンタップで買い物リストへ', en: 'One tap from inventory to shopping list' },
      { ja: '家族との共有', en: 'Share with your household' },
      { ja: 'ウィジェットから確認', en: 'Check from the home-screen widget' },
    ],
    // appStoreUrl: 'https://apps.apple.com/...',  // TODO: 実URLを設定
    // supportUrl: 'https://...',
    // githubUrl: 'https://github.com/...',
  },
  {
    id: 'furusato-memo',
    name: 'Furusato Memo',
    category: 'Web',
    featured: true,
    status: 'active',
    technologies: ['React', 'TypeScript', 'Vite'],
    platforms: ['Web'],
    hasDetailPage: true,
    description: {
      ja: 'ふるさと納税の申し込みと返礼品の記録を、確定申告まで見失わないためのWebアプリ。',
      en: 'Keeps hometown-tax donations and their paperwork in order until filing season.',
    },
    longDescription: {
      ja: '寄付した自治体、返礼品、控除の書類。年末にまとめて探し回らないよう、その都度残しておくための道具です。',
      en: 'Municipalities, gifts, and deduction paperwork — recorded as you go, so nothing has to be reconstructed in December.',
    },
  },
  {
    id: 'unit-price-scanner',
    name: 'Unit Price Scanner',
    category: 'iOS',
    status: 'active',
    technologies: ['Swift', 'VisionKit'],
    platforms: ['iPhone'],
    description: {
      ja: '棚の前でラベルを読み取り、単価をその場で比べるためのスキャナ。',
      en: 'Scan a shelf label and compare unit prices without doing the math.',
    },
  },
  {
    id: 'portfolio-hub',
    name: 'Portfolio Hub',
    category: 'Website',
    status: 'active',
    technologies: ['React', 'GitHub Pages'],
    platforms: ['Web'],
    description: {
      ja: 'このサイト。プロダクトとサポートページへの入口をまとめています。',
      en: 'This site — the entry point to every product and its support page.',
    },
  },
  {
    id: 'kakeibo-lens',
    name: 'Kakeibo Lens',
    category: 'Tool',
    status: 'coming-soon',
    technologies: ['Swift', 'Vision'],
    description: {
      ja: 'レシートを撮って家計簿に流し込む、試作中のツール。',
      en: 'An experiment: photograph a receipt, get it into your budget.',
    },
  },
];

export const featuredProjects = () => projects.filter((p) => p.featured);

export const groupOrder = ['iOS', 'Web', 'Tools'] as const;
export type GroupKey = (typeof groupOrder)[number];

export const groupOf = (p: Project): GroupKey =>
  p.category === 'iOS' ? 'iOS' : p.category === 'Tool' ? 'Tools' : 'Web';
