import api from './api';
export const getSummary = (pdfId) => api.get(`/pdfs/${pdfId}/summary`);
export const retrySummary = (pdfId) => api.post(`/pdfs/${pdfId}/summary/retry`);
export const getQuestions = (pdfId) => api.get(`/pdfs/${pdfId}/questions`);
export const retryQuestions = (pdfId) => api.post(`/pdfs/${pdfId}/questions/retry`);
export const getNote = (pdfId) => api.get(`/pdfs/${pdfId}/note`);
export const saveNote = (pdfId, content) => api.put(`/pdfs/${pdfId}/note`, { content });
