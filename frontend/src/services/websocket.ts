export type WebSocketMessage = {
  type: string;
  status?: string;
  message?: string;
  chunk_number?: number;
  speech_chunks?: number;
  is_speech?: boolean;
  probability?: number;
  text?: string;
  is_final?: boolean;
};

export class TranscriptionWebSocket {
  private socket: WebSocket | null = null;

  connect(
    onMessage: (message: WebSocketMessage) => void,
    onError?: () => void,
    onClose?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const rawWsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
      const wsUrl = `${rawWsUrl.replace(/\/$/, '')}/ws/transcribe`;

      this.socket = new WebSocket(wsUrl);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage(message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      };

      this.socket.onerror = () => {
        console.error('WebSocket connection error');
        onError?.();
        reject(new Error('WebSocket connection failed'));
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        onClose?.();
      };
    });
  }

  sendAudioChunk(chunk: Float32Array | Blob | ArrayBuffer) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    if (chunk instanceof Blob || chunk instanceof ArrayBuffer) {
      this.socket.send(chunk);
    } else {
      this.socket.send(chunk as unknown as BufferSource);
    }
  }

  sendControlMessage(message: Record<string, unknown>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}