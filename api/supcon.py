from typing import Optional, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class ProjectionHead(nn.Module):
    def __init__(self, input_dim: int = 768, hidden_dim: int = 256, output_dim: int = 128):
        super(ProjectionHead, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.net(x), dim=1)

def save_model(model: nn.Module, path: str):
    """モデルの保存"""
    try:
        torch.save(model.state_dict(), path)
    except Exception as e:
        print(f"Error saving model: {e}")

def load_model(model: nn.Module, path: str) -> bool:
    """モデルの読み込み"""
    if not os.path.exists(path):
        return False
    try:
        model.load_state_dict(torch.load(path))
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def supcon_loss(features: torch.Tensor, labels: torch.Tensor, temperature: float = 0.07) -> torch.Tensor:
    """
    Supervised Contrastive Learning Loss.
    """
    device = features.device
    batch_size = features.shape[0]
    
    # Compute similarity matrix
    logits = torch.div(torch.matmul(features, features.T), temperature)
    
    # For numerical stability
    logits_max, _ = torch.max(logits, dim=1, keepdim=True)
    logits = logits - logits_max.detach()
    
    # Create positive mask
    labels = labels.contiguous().view(-1, 1)
    mask = torch.eq(labels, labels.T).float().to(device)
    
    # Mask out self-similarity
    logits_mask = torch.scatter(
        torch.ones_like(mask),
        1,
        torch.arange(batch_size).view(-1, 1).to(device),
        0
    )
    mask = mask * logits_mask
    
    # Compute log_prob
    exp_logits = torch.exp(logits) * logits_mask
    log_prob = logits - torch.log(exp_logits.sum(1, keepdim=True) + 1e-6)
    
    # Compute mean of log-likelihood over positive pairs
    denominator = mask.sum(1)
    # 0除算を避ける
    mask_sum = torch.where(denominator > 0, denominator, torch.ones_like(denominator))
    mean_log_prob_pos = (mask * log_prob).sum(1) / mask_sum
    
    loss = -mean_log_prob_pos[denominator > 0].mean()
    return loss if not torch.isnan(loss) else torch.tensor(0.0)

def train_supcon(embeddings: np.ndarray, labels: np.ndarray, epochs: int = 50, lr: float = 0.001) -> np.ndarray:
    """
    軽量なSupCon学習ループ
    """
    if len(embeddings) < 2:
        return embeddings # もしデータが少なすぎる場合はそのまま返す

    input_dim = embeddings.shape[1]
    model = ProjectionHead(input_dim=input_dim)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    
    x = torch.from_numpy(embeddings).float()
    y = torch.from_numpy(labels).long()
    
    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        features = model(x)
        loss = supcon_loss(features, y)
        loss.backward()
        optimizer.step()
        
    model.eval()
    with torch.no_grad():
        projected_vectors = model(x).detach().cpu().numpy()
        
    return projected_vectors
