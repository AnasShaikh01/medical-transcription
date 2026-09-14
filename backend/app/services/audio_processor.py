import numpy as np
import torch

class AudioProcessor:
    def __init__(self, target_sample_rate: int = 16000):
        self.target_sample_rate = target_sample_rate

    def bytes_to_float32(self, raw_bytes: bytes) -> np.ndarray:
        """Convert incoming raw Float32 PCM bytes to a 1D NumPy array."""
        if not raw_bytes:
            return np.array([], dtype=np.float32)
        
        # AudioWorklet sends standard 32-bit little-endian floats
        audio_np = np.frombuffer(raw_bytes, dtype=np.float32)
        
        # Guard against NaN / Inf values
        audio_np = np.nan_to_num(audio_np, nan=0.0, posinf=1.0, neginf=-1.0)
        return audio_np

    def to_torch_tensor(self, audio_np: np.ndarray) -> torch.Tensor:
        """Convert NumPy float32 array to a 1D PyTorch tensor."""
        return torch.from_numpy(audio_np).float()