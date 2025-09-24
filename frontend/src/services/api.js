import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('token');
      window.location.href = '/login';
    }
    
    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      const errorMessage = error.response?.data?.error || 'Something went wrong';
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => {
    console.log('🌐 Making login API call to:', `${API_BASE_URL}/auth/login`);
    return apiClient.post('/auth/login', credentials).then(res => {
      console.log('✅ Login API response:', { status: res.status, hasData: !!res.data });
      return res.data;
    }).catch(error => {
      console.error('❌ Login API error:', error.response?.status, error.response?.data);
      throw error;
    });
  },
  register: (userData) => apiClient.post('/auth/register', userData).then(res => res.data),
  logout: () => apiClient.post('/auth/logout').then(res => res.data),
  getCurrentUser: () => apiClient.get('/users/profile').then(res => res.data),
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile').then(res => res.data),
  updateProfile: (data) => apiClient.put('/users/profile', data).then(res => res.data),
  uploadAvatar: (formData) => {
    return apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  searchUsers: (params) => apiClient.get('/users/search', { params }).then(res => res.data),
  getRecommendations: () => apiClient.get('/users/recommendations').then(res => res.data),
  getUserById: (userId) => apiClient.get(`/users/${userId}`).then(res => res.data.user),
  getProfileVisitors: () => apiClient.get('/users/profile/visitors').then(res => res.data),
};

// Connections API
export const connectionsAPI = {
  getConnections: () => apiClient.get('/connections').then(res => res.data),
  sendRequest: (receiverId) => apiClient.post('/connections/send', { receiverId }).then(res => res.data),
  respondToRequest: (connectionId, action) => apiClient.put(`/connections/${connectionId}/respond`, { action }).then(res => res.data),
  getPendingRequests: () => apiClient.get('/connections/requests').then(res => res.data),
};

// Admin API
export const adminAPI = {
  getUsers: () => apiClient.get('/admin/users').then(res => res.data),
  updateUserStatus: (userId, status) => apiClient.put(`/admin/users/${userId}/status`, { status }).then(res => res.data),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`).then(res => res.data),
  getStats: () => apiClient.get('/admin/stats').then(res => res.data),
};

// Media API
export const mediaAPI = {
  uploadVideo: (formData) => {
    return apiClient.post('/media/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  getUserVideos: (userId) => {
    const endpoint = userId ? `/media/videos/${userId}` : '/media/videos';
    return apiClient.get(endpoint).then(res => res.data);
  },
  deleteVideo: (videoId) => apiClient.delete(`/media/video/${videoId}`).then(res => res.data),
};

// Combined API object for easier imports
// Statistics API
export const statsAPI = {
  getMyStats: () => apiClient.get('/stats/me').then(res => res.data),
  updateMyStats: (data) => apiClient.put('/stats/me', data).then(res => res.data),
  getUserStats: (userId) => apiClient.get(`/stats/user/${userId}`).then(res => res.data),
};

// Follow API
export const followAPI = {
  followUser: (userId) => apiClient.post(`/follow/${userId}/follow`).then(res => res.data),
  unfollowUser: (userId) => apiClient.delete(`/follow/${userId}/unfollow`).then(res => res.data),
  getFollowers: (userId) => apiClient.get(`/follow/${userId}/followers`).then(res => res.data),
  getFollowing: (userId) => apiClient.get(`/follow/${userId}/following`).then(res => res.data),
  checkFollowStatus: (userId) => apiClient.get(`/follow/${userId}/status`).then(res => res.data),
};

// Messages API
export const messagesAPI = {
  sendMessage: (receiverId, content) => apiClient.post('/messages', { receiverId, content }).then(res => res.data),
  getConversations: () => apiClient.get('/messages/conversations').then(res => res.data),
  getConversation: (otherUserId, page = 1, limit = 50) => 
    apiClient.get(`/messages/conversation/${otherUserId}?page=${page}&limit=${limit}`).then(res => res.data),
  markAsRead: (otherUserId) => apiClient.put(`/messages/read/${otherUserId}`).then(res => res.data),
};

export const api = {
  auth: authAPI,
  users: usersAPI,
  connections: connectionsAPI,
  admin: adminAPI,
  media: mediaAPI,
  stats: statsAPI,
  follow: followAPI,
  messages: messagesAPI,
};

export default apiClient;