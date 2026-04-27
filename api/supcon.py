import numpy as np
from sklearn.decomposition import PCA
from typing import List, Dict, Any

def train_supcon(embeddings: np.ndarray, labels: np.ndarray, epochs: int = 50, lr: float = 0.01) -> np.ndarray:
    """
    NumPyによる超軽量SupCon実装（投影ヘッドの学習）
    Vercelのサイズ制限を回避するため、Torchの代わりにPure NumPyで動作します。
    """
    if len(embeddings) < 2:
        return embeddings

    N, D = embeddings.shape
    hidden_dim = 128
    output_dim = 64
    
    # 重みの初期化 (簡易的な2層MLP)
    # 乱数のシードを固定して再現性を確保
    np.random.seed(42)
    W1 = np.random.randn(D, hidden_dim) * 0.01
    W2 = np.random.randn(hidden_dim, output_dim) * 0.01

    # 軽量な学習ループ (勾配降下法)
    for _ in range(epochs):
        # Forward pass
        # ReLU活性化関数
        h = np.maximum(0, embeddings @ W1) 
        z = h @ W2
        # L2正規化 (特徴量を単位球上に投影)
        z_norm = np.linalg.norm(z, axis=1, keepdims=True)
        z = z / (z_norm + 1e-8)
        
        # 簡易的な対照学習の更新
        # 正例（同じラベル）を近づけ、負例を遠ざける
        for i in range(N):
            pos_mask = (labels == labels[i])
            pos_mask[i] = False # 自分自身を除外
            
            if not np.any(pos_mask):
                continue
            
            # 簡略化した勾配: (正例との平均差) - (全体の平均との差)
            # これにより、同じラベルのクラスターを形成しつつ分散を維持する
            grad_z = -np.mean(z[pos_mask] - z[i], axis=0) * 0.1
            grad_z += (z[i] - np.mean(z, axis=0)) * 0.05
            
            # Backpropagation (簡易版)
            # z = h * W2 -> dz/dW2 = h
            delta_W2 = h[i:i+1].T @ grad_z.reshape(1, -1)
            W2 -= lr * delta_W2
            
            # h = embeddings * W1 -> dh/dW1 = embeddings (if h > 0)
            if np.any(h[i] > 0):
                grad_h = grad_z @ W2.T
                grad_h[h[i] <= 0] = 0 # ReLU gradient
                delta_W1 = embeddings[i:i+1].T @ grad_h.reshape(1, -1)
                W1 -= lr * delta_W1
            
    # 学習後の最終的な特徴量を計算
    final_h = np.maximum(0, embeddings @ W1)
    final_z = final_h @ W2
    final_z = final_z / (np.linalg.norm(final_z, axis=1, keepdims=True) + 1e-8)
    
    return final_z
