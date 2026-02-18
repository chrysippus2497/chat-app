import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: '/api/v1', // ← Changed from '/api' to '/api/v1'
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Important for Sanctum
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH ENDPOINTS ====================
export const authAPI = {
    me: () => api.get('/me'), // ← Changed from '/user' to '/me' (matches your routes)
    logout: () => api.post('/logout'),
};

// ==================== CHAT ENDPOINTS ====================
export const chatAPI = {
    getConversations: () => api.get('/conversations'),
    getConversation: (id) => api.get(`/conversations/${id}`),
    createConversation: (data) => api.post('/conversations', data),
    
    // Messages - updated to match your nested routes
    getMessages: (conversationId, page = 1) => 
        api.get(`/conversations/${conversationId}/messages`, { params: { page } }),
    sendMessage: (conversationId, data) => 
        api.post(`/conversations/${conversationId}/messages`, data), // ← Updated
    
    markAsRead: (conversationId) => 
        api.post(`/conversations/${conversationId}/read`),
    deleteMessage: (messageId) => 
        api.delete(`/messages/${messageId}`),
    setTyping: (conversationId, isTyping) => 
        api.post(`/conversations/${conversationId}/typing`, { typing: isTyping }),
};

// ==================== FILE UPLOAD ====================
export const uploadAPI = {
    uploadFile: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            },
        });
    },
};

export default api;