import type { Project } from '../types';

/**
 * プロジェクトを追加する手順:
 *  1. public/projects/ に画像を置く（任意）
 *  2. この配列に 1 件追加する
 *  3. ja / en の説明を書く
 *  4. 実在する URL のみ設定する（不明なキーは書かない）
 *  5. 必要なら featured: true / hasDetailPage: true
 * コンポーネント側の修正は不要。
 *
 * 出典: 各リポジトリの README / CLAUDE.md / 公開中のサポートサイトに加え、
 * App Store Connect API（isitest1のApp Store Connectアカウント）で実際のapp-store-state
 * を確認して作成（2026-08-26）。appStoreState: READY_FOR_SALE のものだけ appStoreUrl /
 * status: 'active' を設定しています。未公開のURLは記載していません。
 */
export const projects: Project[] = [
  {
    id: 'needsoon',
    name: 'NeedSoon（ないかも）',
    category: 'iOS',
    featured: true,
    status: 'active',
    technologies: ['Swift', 'SwiftUI', 'Supabase', 'WidgetKit'],
    platforms: ['iPhone', 'iPad', 'Apple Watch'],
    hasDetailPage: true,
    description: {
      ja: '「あれ、もう無いかも」と思った瞬間に登録できる、切らす前に気づける買い物・在庫アプリ。',
      en: 'Add an item the instant you notice it might be running low — before you actually run out.',
    },
    longDescription: {
      ja: 'テキスト・音声入力・バーコード・写真OCRなど、思いついた手段でそのまま登録できます。ホーム画面ウィジェットやSiri、Apple Watchからも確認・追加でき、サインアップ不要のQRコードで家族と在庫リストを共有できます。同じ仕組みでAndroid版の開発も進めています。',
      en: 'Add items however is fastest in the moment — typed, spoken, scanned as a barcode, or read from a photo. Check the list from the home-screen widget, Siri, or Apple Watch, and share it with your household via a no-signup QR code. An Android version is also in development on the same backend.',
    },
    features: [
      { ja: 'テキスト・音声・バーコード・写真OCRで入力', en: 'Add by text, voice, barcode, or photo OCR' },
      { ja: 'ウィジェット・Siri・Apple Watchに対応', en: 'Widget, Siri, and Apple Watch support' },
      { ja: 'サインアップ不要のQRコードで家族と共有', en: 'No-signup QR code sharing with your household' },
    ],
    appStoreUrl: 'https://apps.apple.com/jp/app/id6792124859',
    supportUrl: 'https://isitest1.github.io/needsoon-support/',
    screenshots: ['/projects/needsoon-1.png'],
  },
  {
    id: 'workoutquest',
    name: 'WorkoutQuest',
    category: 'iOS',
    featured: true,
    status: 'active',
    technologies: ['Swift', 'SwiftUI', 'SwiftData'],
    platforms: ['iPhone'],
    hasDetailPage: true,
    description: {
      ja: '「やらなきゃ」ではなく「育てたい」で続けられる、ごほうび型のトレーニング習慣化アプリ。',
      en: 'A reward-based workout habit tracker — built to make you want to keep going, not feel guilty when you stop.',
    },
    longDescription: {
      ja: '曜日ごとのメニュー、連続記録、経験値に加えて、トレーニングに応じて育っていくマスコット「フタバ」がいます。休養日はきちんと守られる設計で、罪悪感ではなく達成感で習慣を積み重ねられます。',
      en: 'Weekly per-day menus, streaks, and XP are paired with a mascot that visibly grows as you train. Rest days are protected by design, so the habit builds on a sense of progress rather than guilt.',
    },
    features: [
      { ja: '曜日ごとのメニューと連続記録', en: 'Per-day menus and streak tracking' },
      { ja: 'トレーニングで育つマスコット', en: 'A mascot that grows as you train' },
      { ja: '休養日を守るしくみ', en: 'Built-in rest-day protection' },
    ],
    appStoreUrl: 'https://apps.apple.com/jp/app/id6790803132',
    supportUrl: 'https://isitest1.github.io/workoutquest-site/',
  },
  {
    id: 'furusato-cospa',
    name: 'ふるさとコスパ',
    category: 'Web',
    featured: true,
    status: 'active',
    technologies: ['TypeScript', 'Cloudflare Workers', 'Supabase'],
    platforms: ['Web', 'Chrome'],
    hasDetailPage: true,
    description: {
      ja: '楽天ふるさと納税の返礼品を単価・還元率で比較し、コスパの良い寄付先をひと目で見つけるツール。',
      en: 'Compares Rakuten hometown-tax gifts by unit price and reward rate, so the best-value donation stands out at a glance.',
    },
    longDescription: {
      ja: '似たような返礼品が並んでいても、量や還元率はまちまちです。このツールはそれらを揃えて比較できるようにし、Webアプリと Chrome 拡張機能の両方から使えます。',
      en: 'Similar-looking gifts often differ a lot in quantity and reward rate. This tool normalizes them for a fair comparison, available both as a web app and as a Chrome extension.',
    },
    features: [
      { ja: '単価・還元率で自動比較', en: 'Automatic comparison by unit price and reward rate' },
      { ja: 'Webアプリと Chrome 拡張機能で利用可能', en: 'Available as both a web app and a Chrome extension' },
    ],
    websiteUrl: 'https://furusato-cospa.kouhei1.workers.dev/',
    chromeWebStoreUrl: 'https://chromewebstore.google.com/detail/mopedkejokejahoekdkfgccgiaicipld',
  },
  {
    id: 'textsnap',
    name: 'TextSnap',
    category: 'Tool',
    featured: true,
    status: 'active',
    technologies: ['Swift', 'SwiftUI', 'Vision'],
    platforms: ['Mac'],
    hasDetailPage: true,
    description: {
      ja: '画面上の好きな範囲を選ぶだけで、オンデバイスOCRでテキストを読み取れる軽量なmacOSメニューバーアプリ。',
      en: 'A lightweight macOS menu-bar app: select any region of the screen and read its text with on-device OCR.',
    },
    longDescription: {
      ja: 'ショートカットで範囲を選択すると、AppleのVisionフレームワークがその場でテキストを認識し、コピー&ペーストできる状態にします。通信や解析は一切行わず、署名・公証済みのDMGとしてGitHub Releasesから配布しています。',
      en: 'Trigger the shortcut, drag a selection, and Apple’s Vision framework reads the text on the spot — ready to paste. No network calls, no analytics; distributed as a signed, notarized DMG via GitHub Releases.',
    },
    features: [
      { ja: 'オンデバイスOCR（通信なし）', en: 'On-device OCR — no network calls' },
      { ja: 'ショートカットで画面の好きな範囲を選択', en: 'Shortcut-driven selection of any screen region' },
      { ja: '署名・公証済みDMGで配布', en: 'Distributed as a signed, notarized DMG' },
    ],
    websiteUrl: 'https://isitest1.github.io/TextSnap/',
    githubUrl: 'https://github.com/isitest1/TextSnap',
  },
  {
    id: 'unit-price-scanner',
    name: 'UnitPriceScanner',
    category: 'iOS',
    status: 'active',
    technologies: ['Swift', 'SwiftUI', 'Vision', 'AVFoundation'],
    platforms: ['iPhone'],
    hasDetailPage: true,
    description: {
      ja: '値札を撮影するだけで、税込・税抜や量り売りの重さも加味して単価を計算し、その場で比べられるスキャナ。',
      en: 'Photograph a price tag and it works out the per-unit price on the spot — tax and even estimated weight included.',
    },
    longDescription: {
      ja: 'オンデバイスのVisionフレームワークで価格と数量を読み取り、100gあたり・1kgあたりの単価に換算します。魚は長さ、野菜は個数から重さを推定する機能や、総務省の小売価格統計を参照する機能もあります。',
      en: 'On-device Vision OCR reads the price and quantity, then converts them to a per-100g or per-kg unit price. It can even estimate weight for fish (by length) or produce (by count), and cross-references government retail-price statistics.',
    },
    features: [
      { ja: '税込・税抜どちらにも対応', en: 'Handles both tax-inclusive and tax-exclusive prices' },
      { ja: '魚・野菜の重さ推定', en: 'Weight estimation for fish and produce' },
      { ja: '直近30件の履歴を端末内に保存', en: 'Keeps the last 30 scans on-device' },
    ],
    appStoreUrl: 'https://apps.apple.com/jp/app/id6789856620',
    supportUrl: 'https://isitest1.github.io/unitpricescanner-support/',
  },
  {
    id: 'ensemble-stage',
    name: 'EnsembleStage',
    category: 'iOS',
    status: 'active',
    technologies: ['Swift', 'SwiftUI', 'SwiftData'],
    platforms: ['iPhone', 'iPad'],
    hasDetailPage: true,
    description: {
      ja: '吹奏楽やアンサンブルの立ち位置を自動で組み、PDFやPNGで書き出せるiPad向けのステージ配置アプリ。',
      en: 'Auto-arranges a wind ensemble’s stage layout from your roster, and exports it as a PDF or PNG.',
    },
    longDescription: {
      ja: '名簿を登録すると立ち位置を自動で配置し、ドラッグで細かく調整できます。アカウント登録や通信は不要で、完成した配置図はその場で書き出せます。',
      en: 'Register your roster and it lays out the stage automatically, with drag-to-adjust for fine control. No account or network needed — export the finished chart right away.',
    },
    features: [
      { ja: '名簿から立ち位置を自動配置', en: 'Auto-arranges stage positions from your roster' },
      { ja: 'ドラッグで微調整', en: 'Fine-tune positions by dragging' },
      { ja: 'PDF / PNGで書き出し', en: 'Export as PDF or PNG' },
    ],
    appStoreUrl: 'https://apps.apple.com/jp/app/id6793795823',
    supportUrl: 'https://isitest1.github.io/ensemble-stage-site/',
    screenshots: ['/projects/ensemblestage-1.png'],
  },
  {
    id: 'netagicho',
    name: 'ネタ帳',
    category: 'iOS',
    status: 'active',
    technologies: ['Swift', 'SwiftUI'],
    platforms: ['iPhone'],
    hasDetailPage: true,
    description: {
      ja: '思いついた話のネタやアイデアを、開いてすぐ一行で書き留められるメモアプリ。',
      en: 'Jot down a fleeting idea or topic in one line the moment it occurs to you.',
    },
    longDescription: {
      ja: '分類を必須にせず、開いたその場で書き留められます。あとから「話した」「取っておく」で振り返れる、芸人のネタ帳のような使い方を想定しています。',
      en: 'No mandatory categorizing — just open the app and write. Mark entries “talked about” or “keep for later” and revisit them like a comedian’s joke notebook.',
    },
    features: [
      { ja: '開いてすぐ一行で記録', en: 'One-line capture the moment you open it' },
      { ja: '「話した」「取っておく」で振り返り', en: '"Talked about" / "keep for later" review states' },
      { ja: 'ランダム表示・検索に対応', en: 'Random shuffle and search' },
    ],
    appStoreUrl: 'https://apps.apple.com/jp/app/id6797323735',
    supportUrl: 'https://isitest1.github.io/netagicho/',
    screenshots: ['/projects/futomemo-1.png'],
  },
  {
    id: 'photoslim',
    name: 'スッキリGB',
    category: 'iOS',
    status: 'coming-soon',
    technologies: ['Swift', 'SwiftUI'],
    platforms: ['iPhone'],
    hasDetailPage: true,
    description: {
      ja: '似た写真や大きな動画をスワイプで整理し、写真ライブラリの空き容量を取り戻すアプリ。',
      en: 'Swipe through your photo library to clear out near-duplicates and bulky videos, and reclaim storage space.',
    },
    longDescription: {
      ja: 'カメラロールを1枚ずつスワイプで見ていき、似た写真やサイズの大きい動画をその場で仕分けられます。',
      en: 'Swipe through your camera roll one photo at a time, sorting out near-duplicates and oversized videos as you go.',
    },
    supportUrl: 'https://isitest1.github.io/photoslim-support/',
    screenshots: ['/projects/phototidy-1.png'],
  },
  {
    id: 'namecue',
    name: 'NameCue',
    category: 'iOS',
    status: 'active',
    technologies: ['Swift', 'SwiftUI'],
    platforms: ['iPhone'],
    hasDetailPage: true,
    description: {
      ja: '会食や会議で人の名前をそっと確認できる、席順ベースの名前思い出しアプリ。',
      en: 'Recall names discreetly at a dinner or meeting by placing people on a seat map first.',
    },
    longDescription: {
      ja: '会う前に席順や座席表として人を配置しておくと、必要なときだけそっと名前を確認できます。データは端末内のみで完結し、Face IDでロックすることもできます。',
      en: 'Place people on a seat map before you meet them, then glance at a name only when you need it. Everything stays on-device, with an optional Face ID lock.',
    },
    features: [
      { ja: '席順・座席表から名前を確認', en: 'Recall names from a seat map' },
      { ja: 'データは端末内のみ、通信なし', en: 'On-device only, no network calls' },
      { ja: 'Face IDでロック可能', en: 'Optional Face ID lock' },
    ],
    appStoreUrl: 'https://apps.apple.com/jp/app/id6791782983',
    supportUrl: 'https://isitest1.github.io/NameCue/support.html',
  },
  {
    id: 'record-quick',
    name: 'RecordQuick',
    category: 'iOS',
    status: 'coming-soon',
    technologies: ['Swift', 'SwiftUI'],
    platforms: ['iPhone', 'iPad'],
    description: {
      ja: 'ワンタップで録音を開始でき、バックグラウンドでも止まらない録音アプリ。最大30言語の文字起こしに対応。',
      en: 'Start recording in one tap and keep going in the background, with speech-to-text in roughly 30 languages.',
    },
    supportUrl: 'https://isitest1.github.io/RecordQuick-site/',
  },
  {
    id: 'rig-sketch',
    name: 'RigSketch',
    category: 'iOS',
    status: 'coming-soon',
    technologies: ['Swift', 'SwiftUI'],
    platforms: ['iPhone', 'iPad'],
    description: {
      ja: '竿・リール・ライン・ウキ・オモリなどのパーツを組み合わせて、釣りの仕掛け図を作れるアプリ。',
      en: 'Build a fishing rig diagram by picking and connecting parts — rod, reel, line, float, sinker, and more.',
    },
  },
  {
    id: 'tube-player-for-safari',
    name: 'Tube Player for Safari',
    category: 'Tool',
    status: 'coming-soon',
    technologies: ['Swift', 'JavaScript'],
    platforms: ['iPhone', 'iPad', 'Mac'],
    description: {
      ja: 'SafariのYouTube再生をネイティブのHTML5プレーヤーに置き換える機能拡張。AirPlayやPinP、通信・解析なしに対応。',
      en: 'A Safari Web Extension that swaps YouTube’s player for native HTML5 — AirPlay and Picture-in-Picture, zero network calls.',
    },
    supportUrl: 'https://isitest1.github.io/tube-player-for-safari-site/',
  },
  {
    id: 'web-monitor-rss',
    name: 'Web Monitor RSS',
    category: 'Tool',
    status: 'active',
    technologies: ['TypeScript', 'Cloudflare Workers', 'GitHub Actions'],
    platforms: ['Web'],
    description: {
      ja: 'Webページの好きな部分をクリックで指定し、変化があったときだけプライベートなRSSで受け取れる監視ツール。',
      en: 'Point-and-click to select part of a webpage, then get a private RSS feed only when it changes.',
    },
    githubUrl: 'https://github.com/isitest1/web-monitor-rss',
  },
  {
    id: 'text-compare',
    name: 'Text Compare',
    category: 'Tool',
    status: 'active',
    technologies: ['JavaScript'],
    platforms: ['Web'],
    description: {
      ja: '2つのテキストを並べて比較し、差分をハイライトするだけのシンプルなツール。',
      en: 'A no-frills side-by-side text-diff tool — paste two versions, see what changed.',
    },
    websiteUrl: 'https://isitest1.github.io/text-compare/',
    githubUrl: 'https://github.com/isitest1/text-compare',
  },
  {
    id: 'portfolio-hub',
    name: 'Portfolio Hub',
    category: 'Website',
    status: 'active',
    technologies: ['React', 'TypeScript', 'Vite', 'GitHub Pages'],
    platforms: ['Web'],
    description: {
      ja: 'このサイト。プロダクトとサポートページへの入口をまとめています。',
      en: 'This site — the entry point to every product and its support page.',
    },
    githubUrl: 'https://github.com/isitest1/portfolio-hub',
  },
];

export const featuredProjects = () => projects.filter((p) => p.featured);

export const groupOrder = ['iOS', 'Web', 'Tools'] as const;
export type GroupKey = (typeof groupOrder)[number];

export const groupOf = (p: Project): GroupKey =>
  p.category === 'iOS' ? 'iOS' : p.category === 'Tool' ? 'Tools' : 'Web';
