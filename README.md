# SensorySync

> **AIによる感性の同期と高次元特徴の可視化**

SensorySyncは、Google Gemini APIによる高度な画像解析と、Supervised Contrastive Learning (SupCon) を組み合わせた、クリエイティブな画像マッピング・プラットフォームです。アップロードされた画像の「本質（Essence）」を抽出し、感性的な類似性に基づいてベクトル空間を動的に再構築します。

![SensorySync Hero Concept](public/hero-placeholder.png)
*(ここにアプリのメイン画面のGIFまたはスタイリッシュな画像を配置)*

## 主な機能

- **Gemini Essence Extraction**: `gemini-1.5-flash` を使用し、画像からタグ、説明文、支配的なカラーを抽出。
- **SupCon Vector Space**: 抽出された特徴を基に、PyTorchによる教師あり対照学習を実行。類似する感性を持つ画像を自動的に近くに配置。
- **Interactive Map**: 2次元に圧縮されたベクトル空間を、RechartsとFramer MotionによるインタラクティブなUIで探索。
- **Premium Design**: ガラスモーフィズムと洗練されたアニメーションを採用した、感性を刺激するデザイン。

## 技術的背景: SupConの仕組み

本プロジェクトでは、従来の自己教師あり学習（Contrastive Learning）を拡張した **Supervised Contrastive Learning (SupCon)** を採用しています。

1. **Feature Extraction**: Geminiの埋め込みモデル (`embedding-001`) を使用して、画像の説明文から初期ベクトルを取得します。
2. **Auto-Labeling**: Geminiが抽出したタグやカラーに基づき、画像ペアを「Positive（類似）」と「Negative（非類似）」に自動でラベル付けします。
3. **Contrastive Loss**: NT-Xent (Normalized Temperature-scaled Cross Entropy) 損失関数を使用し、Positiveペア間の距離を縮め、Negativeペア間の距離を広げるように投影ヘッドを学習させます。
4. **Manifold Visualization**: 学習後の特徴空間をPCA/t-SNE等で次元圧縮し、意味的な近さを視覚的に表現します。

## セットアップ

### 1. 環境変数の設定

`.env.example` を `.env` にコピーし、Gemini APIキーを設定します。

```bash
cp .env.example .env
# GOOGLE_API_KEY=your_key_here
```

### 2. バックエンド (Python/FastAPI)

```bash
pip install -r requirements.txt
# ローカル実行の場合
uvicorn api.index:app --reload
```

### 3. フロントエンド (Next.js)

```bash
npm install
npm run dev
```

## ディレクトリ構造

```text
.
├── api/                # Python Backend (FastAPI)
│   ├── index.py        # API Routes & Gemini Integration
│   └── supcon.py       # PyTorch SupCon Logic
├── src/                # Next.js Frontend
│   ├── app/            # App Router (Pages, Layouts)
│   └── components/     # UI Components (Map, Upload, etc.)
├── public/             # Static Assets
├── vercel.json         # Deployment Config
└── requirements.txt    # Python Dependencies