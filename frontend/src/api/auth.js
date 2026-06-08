import api from './api';
export const register = (email, password) => api.post('/api/auth/register', { email, password });
export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const deleteAccount = () => api.delete('/api/auth/me');
