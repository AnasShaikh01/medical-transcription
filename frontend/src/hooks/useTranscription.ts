import { useCallback, useRef, useState } from 'react';
import {
  TranscriptionWebSocket,
  type WebSocketMessage,
} from '../services/websocket';

export const useTranscription = (onTranscriptReceived?: (text: string) => void) => {
  const websocketRef = useRef<TranscriptionWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [speechChunks, setSpeechChunks] = useState<number>(0);
  const [isSpeechDetected, setIsSpeechDetected] = useState<boolean>(false);
  const [speechProbability, setSpeechProbability] = useState<number>(0);

  const connect = useCallback(async (): Promise<void> => {
    if (websocketRef.current?.isConnected()) {
      return;
    }

    const ws = new TranscriptionWebSocket();
    websocketRef.current = ws;

    await ws.connect(
      (message: WebSocketMessage) => {
        if (message.type === 'connection') {
          setIsConnected(true);
        }
        if (message.type === 'vad') {
          if (typeof message.chunk_number === 'number') {
            setTotalChunks(message.chunk_number);
          }
          if (typeof message.speech_chunks === 'number') {
            setSpeechChunks(message.speech_chunks);
          }
          if (typeof message.is_speech === 'boolean') {
            setIsSpeechDetected(message.is_speech);
          }
          if (typeof message.probability === 'number') {
            setSpeechProbability(message.probability);
          }
        }
        if (message.type === 'transcript' && message.text) {
          onTranscriptReceived?.(message.text);
        }
      },
      () => {
        setIsConnected(false);
      },
      () => {
        setIsConnected(false);
        websocketRef.current = null;
      }
    );
  }, [onTranscriptReceived]);

  const sendAudioChunk = useCallback((chunk: Float32Array | Blob | ArrayBuffer) => {
    websocketRef.current?.sendAudioChunk(chunk);
  }, []);

  const sendControlMessage = useCallback((message: Record<string, unknown>) => {
    websocketRef.current?.sendControlMessage(message);
  }, []);

  const disconnect = useCallback(() => {
    websocketRef.current?.disconnect();
    websocketRef.current = null;
    setIsConnected(false);
    setTotalChunks(0);
    setSpeechChunks(0);
    setIsSpeechDetected(false);
    setSpeechProbability(0);
  }, []);

  return {
    isConnected,
    totalChunks,
    speechChunks,
    isSpeechDetected,
    speechProbability,
    connect,
    sendAudioChunk,
    sendControlMessage,
    disconnect,
  };
};