export type Lang = 'ja' | 'en';

export type LocalizedText = { ja: string; en: string };

export type Category = 'iOS' | 'Web' | 'Website' | 'Tool' | 'Other';

export type Status = 'active' | 'coming-soon' | 'archived';

export interface Project {
  id: string;
  /** 英語名が別途存在しない製品は、ja/en に同じ文字列を入れる（製品名を勝手に翻訳しない） */
  name: LocalizedText;
  category: Category;
  description: LocalizedText;
  longDescription?: LocalizedText;
  features?: LocalizedText[];
  platforms?: string[];
  technologies?: string[];
  icon?: string;
  /** 言語を問わず同じ画像でよい場合はこちら */
  screenshots?: string[];
  /** ja/en で異なるスクリーンショットを使う場合はこちら（設定時は screenshots より優先） */
  screenshotsByLang?: { ja: string[]; en: string[] };
  /** 実在する URL のみ設定する。不明な場合はキー自体を書かない */
  appStoreUrl?: string;
  chromeWebStoreUrl?: string;
  websiteUrl?: string;
  supportUrl?: string;
  githubUrl?: string;
  documentationUrl?: string;
  featured?: boolean;
  status?: Status;
  hasDetailPage?: boolean;
}
