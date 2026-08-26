export type Lang = 'ja' | 'en';

export type LocalizedText = { ja: string; en: string };

export type Category = 'iOS' | 'Web' | 'Website' | 'Tool' | 'Other';

export type Status = 'active' | 'coming-soon' | 'archived';

export interface Project {
  id: string;
  name: string; // 製品名は翻訳しない
  category: Category;
  description: LocalizedText;
  longDescription?: LocalizedText;
  features?: LocalizedText[];
  platforms?: string[];
  technologies?: string[];
  icon?: string;
  screenshots?: string[];
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
