import torch

class VADService:
    def __init__(self, speech_threshold: float = 0.5):
        """
        Loads official Silero VAD model via PyTorch Hub.
        Cached locally in ~/.cache/torch/hub/
        """
        torch.set_num_threads(1)
        self.model, self.utils = torch.hub.load(
            repo_or_dir='snakers4/silero-vad',
            model='silero_vad',
            force_reload=False,
            onnx=False
        )
        self.speech_threshold = speech_threshold
        self.sample_rate = 16000
        # Silero VAD requires exact 512-sample frames for 16kHz (32ms)
        self.window_size_samples = 512
        self.buffer = torch.tensor([], dtype=torch.float32)

    def is_speech(self, audio_tensor: torch.Tensor) -> dict:
        """
        Feeds incoming audio through the Silero VAD model.
        Evaluates frame-by-frame: detects speech if any sub-frame crosses the threshold,
        preventing boundary clipping.
        """
        if len(audio_tensor) == 0:
            return {"is_speech": False, "probability": 0.0}

        self.buffer = torch.cat((self.buffer, audio_tensor))
        probabilities = []

        with torch.no_grad():
            while len(self.buffer) >= self.window_size_samples:
                frame = self.buffer[:self.window_size_samples]
                self.buffer = self.buffer[self.window_size_samples:]

                prob = self.model(frame, self.sample_rate).item()
                probabilities.append(prob)

        if not probabilities:
            return {"is_speech": False, "probability": 0.0}

        # Streaming evaluation:
        # 1. Peak probability indicates the strongest speech cue in this chunk
        max_prob = max(probabilities)
        # 2. Trigger speech if any frame crosses speech_threshold
        has_speech = any(p >= self.speech_threshold for p in probabilities)

        return {
            "is_speech": has_speech,
            "probability": round(float(max_prob), 4),
        }

    def reset_state(self):
        self.buffer = torch.tensor([], dtype=torch.float32)
        if hasattr(self.model, "reset_states"):
            self.model.reset_states()