import numpy as np

class SpeechBuffer:
    def __init__(
        self,
        sample_rate: int = 16000,
        min_speech_duration_sec: float = 0.6,
        max_speech_duration_sec: float = 4.0,
        silence_flush_threshold_chunks: int = 4, # ~500ms of silence triggers flush
    ):
        self.sample_rate = sample_rate
        self.min_samples = int(sample_rate * min_speech_duration_sec)
        self.max_samples = int(sample_rate * max_speech_duration_sec)
        self.silence_flush_threshold = silence_flush_threshold_chunks

        self.buffer = []
        self.total_samples = 0
        self.consecutive_silence_chunks = 0
        self.has_unprocessed_speech = False

    def add_chunk(self, chunk_np: np.ndarray, is_speech: bool):
        """
        Add a 16kHz float32 audio chunk to the buffer along with VAD decision.
        Returns True if the buffer is ready to be transcribed.
        """
        if is_speech:
            self.buffer.append(chunk_np)
            self.total_samples += len(chunk_np)
            self.consecutive_silence_chunks = 0
            self.has_unprocessed_speech = True

            # If audio has accumulated to maximum duration (~4 sec), force flush
            if self.total_samples >= self.max_samples:
                return True
        else:
            if self.has_unprocessed_speech:
                self.consecutive_silence_chunks += 1
                # If speaker paused after speaking for at least min_speech duration, flush
                if (
                    self.consecutive_silence_chunks >= self.silence_flush_threshold
                    and self.total_samples >= self.min_samples
                ):
                    return True

        return False

    def get_audio_and_clear(self) -> np.ndarray:
        """Concatenates buffered chunks, returns 1D array, and resets state."""
        if not self.buffer:
            return np.array([], dtype=np.float32)

        full_audio = np.concatenate(self.buffer, axis=0)
        self.buffer = []
        self.total_samples = 0
        self.consecutive_silence_chunks = 0
        self.has_unprocessed_speech = False
        return full_audio

    def clear(self):
        """Discards any buffered audio."""
        self.buffer = []
        self.total_samples = 0
        self.consecutive_silence_chunks = 0
        self.has_unprocessed_speech = False