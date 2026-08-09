import api from './api';

export const authService = {
  login: async (usernameOrEmail, password) => {
    return await api.post('/auth/login', { usernameOrEmail, password });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },
};
