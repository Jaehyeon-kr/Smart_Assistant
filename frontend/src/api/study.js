import api from './api';
export const getSummary = (pdfId) => api.get(`/api/pdfs/${pdfId}/summary`);
export const retrySummary = (pdfId) => api.post(`/api/pdfs/${pdfId}/summary/retry`);
export const getQuestions = (pdfId) => api.get(`/api/pdfs/${pdfId}/questions`);
export const retryQuestions = (pdfId) => api.post(`/api/pdfs/${pdfId}/questions/retry`);
export const getNote = (pdfId) => api.get(`/api/pdfs/${pdfId}/note`);
export const saveNote = (pdfId, content) => api.put(`/api/pdfs/${pdfId}/note`, { content });
