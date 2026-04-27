import os
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import numpy as np
from PIL import Image
import io
import json

# Internal imports
try:
    from .supcon import train_supcon
except ImportError:
    from supcon import train_supcon

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Setup
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

class SensorySyncBackend:
    def __init__(self):
        self.vision_model = genai.GenerativeModel('gemini-1.5-flash')
        self.embedding_model = "models/embedding-001"

    async def analyze_image(self, file: UploadFile) -> Dict[str, Any]:
        """Geminiを使用して画像から特徴を抽出する"""
        content = await file.read()
        img = Image.open(io.BytesIO(content))
        
        prompt = """
        この画像を分析し、その特徴を以下のJSON形式で返してください。
        {"tags": ["タグ1", "タグ2", ...], "description": "短い説明文", "dominant_color": "色名"}
        タグは感性的な表現（例：静か、活力、モダン、伝統的）を含めてください。
        """
        
        response = self.vision_model.generate_content([prompt, img])
        try:
            # Extract JSON from response
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            analysis = json.loads(text)
        except Exception:
            analysis = {"tags": ["unknown"], "description": "Analysis failed", "dominant_color": "gray"}
            
        # Get embedding for the description
        embed_res = genai.embed_content(
            model=self.embedding_model,
            content=analysis["description"],
            task_type="clustering"
        )
        
        return {
            "filename": file.filename,
            "analysis": analysis,
            "embedding": embed_res["embedding"]
        }

@app.post("/api/analyze")
async def analyze_images(files: List[UploadFile] = File(...)):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not set")
    
    backend = SensorySyncBackend()
    results = []
    
    for file in files:
        res = await backend.analyze_image(file)
        results.append(res)
        
    return results

@app.post("/api/train")
async def train_and_visualize(data: List[Dict[str, Any]]):
    """
    抽出された特徴を基にラベル付けし、SupCon学習を実行して
    2次元に圧縮されたベクトル空間を返却する
    """
    if len(data) < 2:
        raise HTTPException(status_code=400, detail="At least 2 images are required")

    embeddings = np.array([item["embedding"] for item in data])
    
    # 簡単なラベル付けロジック：最初のタグが同じものを正例とする
    # (実際にはより高度なセマンティック解析によるクラスタリングが望ましい)
    tags = [item["analysis"]["tags"][0] for item in data]
    unique_tags = list(set(tags))
    labels = np.array([unique_tags.index(t) for t in tags])
    
    # SupCon学習 (中身はprojection headのみ)
    # 次元圧縮のために、ここでは128次元に投影した後、t-SNE等に代わり
    # 学習された特徴量の上位2次元またはさらに削減したものを返却する
    projected = train_supcon(embeddings, labels)
    
    # 2次元可視化用の簡易的なPCA（実際にはSupCon空間での相対位置が重要）
    # ここではシンプルにするため、projectedの最初の2次元をスケーリングして返す
    # (本番ではPCAやUMAPを検討)
    from sklearn.decomposition import PCA
    pca = PCA(n_components=2)
    coords = pca.fit_transform(projected)
    
    # 0-1に正規化
    coords = (coords - coords.min(axis=0)) / (coords.max(axis=0) - coords.min(axis=0) + 1e-6)
    
    final_output = []
    for i, item in enumerate(data):
        final_output.append({
            "id": i,
            "filename": item["filename"],
            "analysis": item["analysis"],
            "x": float(coords[i, 0]),
            "y": float(coords[i, 1])
        })
        
    return final_output

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
