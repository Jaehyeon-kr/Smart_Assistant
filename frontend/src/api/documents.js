import api from './api';
export const getDocuments = () => api.get('/pdfs');
export const uploadPDF = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/pdfs', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deleteDocument = (pdfId) => api.delete(`/pdfs/${pdfId}`);
