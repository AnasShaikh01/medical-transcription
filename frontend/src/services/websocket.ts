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
  private finalizeResolver: (() => void) | null = null;

  connect(
    onMessage: (message: WebSocketMessage) => void,
    onError?: () => void,
    onClose?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let hasSettled = false;

      const rawWsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
      const wsUrl = `${rawWsUrl.replace(/^http/, 'ws').replace(/\/$/, '')}/ws/transcribe`;

      this.socket = new WebSocket(wsUrl);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        if (!hasSettled) {
          hasSettled = true;
          resolve();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'finalized' && this.finalizeResolver) {
            this.finalizeResolver();
            this.finalizeResolver = null;
          }

          onMessage(message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      };

      this.socket.onerror = () => {
        onError?.();
        if (!hasSettled) {
          hasSettled = true;
          reject(new Error('WebSocket connection failed'));
        }
      };

      this.socket.onclose = () => {
        if (this.finalizeResolver) {
          this.finalizeResolver();
          this.finalizeResolver = null;
        }
        if (!hasSettled) {
          hasSettled = true;
          reject(new Error('WebSocket closed before connection was established'));
        }
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

  finalizeAndClose(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.disconnect();
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        this.disconnect();
        resolve();
      }, 1500);

      this.finalizeResolver = () => {
        clearTimeout(timeoutId);
        this.disconnect();
        resolve();
      };

      this.socket.send(JSON.stringify({ action: 'finalize' }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}