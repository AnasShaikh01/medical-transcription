import { useState, useRef, useCallback } from 'react';
import type { UseAudioRecorderReturn } from '../types/audio';

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');

  const startRecording = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      chunksRef.current = [];
      setAudioChunks([]);
      setAudioBlob(null);

      // Detect optimal supported format
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          setAudioChunks([...chunksRef.current]);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        setAudioBlob(finalBlob);

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        setIsRecording(false);
      };

      mediaRecorder.start(500);
      setIsRecording(true);
    } catch (err: unknown) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission was denied. Please allow microphone access and try again.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('Unable to access microphone. Please check your device settings.');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred while accessing the microphone.');
      }
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    chunksRef.current = [];
    setAudioChunks([]);
    setAudioBlob(null);
    setError(null);
    setIsRecording(false);
  }, []);

  const downloadRecording = useCallback((customFilename?: string) => {
    const currentMime = mimeTypeRef.current;
    const blobToSave =
      audioBlob ||
      (chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: currentMime }) : null);

    if (!blobToSave) {
      alert('No audio recorded yet. Please start recording first.');
      return;
    }

    const extension = currentMime.includes('mp4') ? 'mp4' : 'webm';
    const filename = customFilename || `consultation-recording.${extension}`;

    const url = URL.createObjectURL(blobToSave);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [audioBlob]);

  return {
    isRecording,
    audioBlob,
    audioChunks,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    downloadRecording,
  };
};