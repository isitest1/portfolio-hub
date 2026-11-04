import type { Lang } from '../types';

export const languages: Lang[] = ['ja', 'en'];

export interface UI {
  meta: { title: string; description: string };
  nav: { products: string; about: string; contact: string };
  hero: { headline: string; body: string };
  sections: { featured: string; all: string; about: string };
  about: string;
  meta_count: (n: number) => string;
  updated: string;
  links: {
    appStore: string;
    chromeWebStore: string;
    website: string;
    support: string;
    github: string;
    docs: string;
    detail: string;
    back: string;
  };
  status: Record<'active' | 'coming-soon' | 'archived', string>;
  detail: {
    overview: string;
    features: string;
    platforms: string;
    tech: string;
    screenshots: string;
    links: string;
  };
  notFound: { title: string; body: string; cta: string };
  langLabel: string;
  switchTo: string;
}

export const ui: Record<Lang, UI> = {
  ja: {
    meta: {
      title: 'Margherita Works — つくったアプリと、その使いどころ',
      description:
        'iPhoneアプリ、Webアプリ、小さなツールをつくっています。それぞれのプロダクトが何をするもので、どこから使えるのかをまとめた場所です。',
    },
    nav: { products: 'プロダクト', about: 'About', contact: 'Contact' },
    hero: {
      headline: 'APPS,\nWEBSITES\n& TOOLS.',
      body: 'iPhoneアプリ、Webアプリ、道具のような小さなツールをつくっています。ここは、それぞれのプロダクトが何をするもので、どこから使えるのかをまとめた場所です。',
    },
    sections: { featured: '主なプロダクト', all: 'すべてのプロダクト', about: 'About' },
    about:
      '買い物の途中、船の上、合奏の前、名前が出てこない会食の席。暮らしや趣味のなかで「これがあれば」と思った場面を起点に、iPhoneアプリとツールをつくっています。',
    meta_count: (n: number) => 'プロダクト ' + n + ' 件',
    updated: '最終更新 2026.10',
    links: {
      appStore: 'App Store',
      chromeWebStore: 'Chrome ウェブストア',
      website: 'Website',
      support: 'サポート',
      github: 'GitHub',
      docs: 'ドキュメント',
      detail: '詳細',
      back: '一覧に戻る',
    },
    status: { active: '公開中', 'coming-soon': '準備中', archived: '公開終了' },
    detail: {
      overview: '概要',
      features: '主な機能',
      platforms: '対応プラットフォーム',
      tech: '使用技術',
      screenshots: 'スクリーンショット',
      links: 'リンク',
    },
    notFound: { title: 'ページが見つかりません', body: 'URLが変わった可能性があります。', cta: 'ホームへ' },
    langLabel: '日本語',
    switchTo: 'English に切り替える',
  },
  en: {
    meta: {
      title: 'Margherita Works — Apps, Websites & Tools',
      description:
        'iPhone apps, web apps and small utilities I build. What each product does, and where to start using it.',
    },
    nav: { products: 'Products', about: 'About', contact: 'Contact' },
    hero: {
      headline: 'APPS,\nWEBSITES\n& TOOLS.',
      body: 'I build iPhone apps, web apps and small tool-like utilities. This is where each product lives: what it does, and where you can start using it.',
    },
    sections: { featured: 'Featured', all: 'All products', about: 'About' },
    about:
      'Halfway down the grocery aisle. Out on the boat. Setting up before band rehearsal. At dinner, when a name won’t come. Each app here starts from a real moment in everyday life — or in a hobby — where something was missing.',
    meta_count: (n: number) => n + ' products',
    updated: 'Updated 2026.10',
    links: {
      appStore: 'App Store',
      chromeWebStore: 'Chrome Web Store',
      website: 'Website',
      support: 'Support',
      github: 'GitHub',
      docs: 'Docs',
      detail: 'Details',
      back: 'Back to all products',
    },
    status: { active: 'Available', 'coming-soon': 'Coming soon', archived: 'Archived' },
    detail: {
      overview: 'Overview',
      features: 'Features',
      platforms: 'Platforms',
      tech: 'Built with',
      screenshots: 'Screenshots',
      links: 'Links',
    },
    notFound: { title: 'Page not found', body: 'The URL may have changed.', cta: 'Go home' },
    langLabel: 'English',
    switchTo: 'Switch to Japanese',
  },
};
