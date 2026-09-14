import axios from 'axios';
import type { MedicalSummaryData } from '../types/medical';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const normalizeMedicalTranscript = async (
  transcript: string
): Promise<string> => {
  const response = await apiClient.post<{
    success: boolean;
    transcript: string;
  }>('/api/medical/normalize', {
    transcript,
  });

  return response.data.transcript;
};

export const extractMedicalSummary = async (
  transcript: string
): Promise<MedicalSummaryData> => {
  const response = await apiClient.post<{
    success: boolean;
    data: MedicalSummaryData;
  }>('/api/medical/extract', {
    transcript,
  });

  return response.data.data;
};