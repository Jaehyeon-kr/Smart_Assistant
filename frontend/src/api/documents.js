import api from './api';
export const getDocuments = () => api.get('/api/pdfs');
export const uploadPDF = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/pdfs', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deleteDocument = (pdfId) => api.delete(`/api/pdfs/${pdfId}`);
