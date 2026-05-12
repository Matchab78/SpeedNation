export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) {
    const base = (typeof window !== 'undefined' && window.location?.origin) 
      ? window.location.origin 
      : '';
    return `${base}${url}`;
  }
  return url;
};

// Service API pour communiquer avec le backend
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:3000/api';
};
const API_BASE_URL = getApiBaseUrl();

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const isFormData = options.body instanceof FormData;
    
    const fetchOptions = {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      },
    };

    // Very important: if it's FormData, let the browser set the Content-Type with boundary
    if (isFormData && fetchOptions.headers['Content-Type']) {
      delete fetchOptions.headers['Content-Type'];
    }

    console.log(`[API] Fetching ${url}...`);
    const response = await fetch(url, fetchOptions);
    console.log(`[API] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error response:`, errorText);
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { error: errorText };
      }
      throw new Error(errorJson.error || 'API request failed');
    }

    const result = await response.json();
    console.log(`[API] Response data:`, result);
    return result;
  }

  async get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  async post(endpoint, data, headers = {}) {
    console.log('API POST:', endpoint, data);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
  }

  async put(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers,
    });
  }

  async delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

const apiService = new ApiService();

// Auth API
export const authApi = {
  signUp: (email, password, fullName, profession, location, age) =>
    apiService.post('/auth/signup', { email, password, fullName, profession, location, age }),

  signIn: (email, password) =>
    apiService.post('/auth/signin', { email, password }),

  signOut: (token) =>
    apiService.post('/auth/signout', { token }),

  getUser: (userId) =>
    apiService.get(`/auth/user/${userId}`),
};

// Cars API
export const carsApi = {
  getAll: () => apiService.get('/cars'),
  
  getById: (id) => apiService.get(`/cars/${id}`),
  
  create: (carData) => apiService.post('/cars', carData),
  
  update: (id, carData) => apiService.put(`/cars/${id}`, carData),
  
  getByUserId: (userId) => apiService.get(`/cars?user_id=${userId}`),
  
  delete: (id) => apiService.delete(`/cars/${id}`),
  
  toggleFavorite: (id, userId) => apiService.post(`/cars/${id}/favorite`, { user_id: userId }),
};

// Events API
export const eventsApi = {
  getAll: () => apiService.get('/events'),
  
  getById: (id) => apiService.get(`/events/${id}`),
  
  create: (eventData) => apiService.post('/events', eventData),
  
  update: (id, eventData) => apiService.put(`/events/${id}`, eventData),
  
  delete: (id) => apiService.delete(`/events/${id}`),
  
  join: (id, userId) => apiService.post(`/events/${id}/join`, { user_id: userId }),
  
  leave: (id, userId) => apiService.post(`/events/${id}/leave`, { user_id: userId }),
};

// Messaging API
export const messagingApi = {
  getConversations: (userId) => apiService.get(`/messaging/conversations?user_id=${userId}`),
  
  getMessages: (conversationId) => apiService.get(`/messaging/conversations/${conversationId}/messages`),
  
  createConversation: (participants) => apiService.post('/messaging/conversations', participants),
  
  sendMessage: (messageData) => apiService.post('/messaging/messages', messageData),
};

// Admin API
export const adminApi = {
  getStats: () => apiService.get('/admin/stats'),
  getUsers: () => apiService.get('/admin/users'),
  getEvents: () => apiService.get('/admin/events'),
  toggleEventFeature: (id, isFeatured) => 
    apiService.put(`/admin/events/${id}/feature`, { is_featured: isFeatured }),
  deleteUser: (id) => apiService.delete(`/admin/users/${id}`),
  updateUserRole: (id, role) => apiService.put(`/admin/users/${id}/role`, { role }),
};

export const profilesApi = {
  search: (query) => apiService.get(`/profiles/search?q=${query}`),
  
  getById: (id) => apiService.get(`/profiles/${id}`),
  
  getFollowStatus: (id, followerId) => 
    apiService.get(`/profiles/${id}/follow-status?follower_id=${followerId}`),
  
  update: (id, profileData) => apiService.put(`/profiles/${id}`, profileData),
  
  follow: (id, followerId) => apiService.post(`/profiles/${id}/follow`, { follower_id: followerId }),
  
  unfollow: (id, followerId) => apiService.delete(`/profiles/${id}/follow?follower_id=${followerId}`),
};

export const storageApi = {
  upload: async (fileUri, bucket) => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    // Sur Web, il faut transformer l'URI en Blob pour que multer le reconnaisse
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append('file', blob, filename);
      } catch (e) {
        console.error('Erreur conversion Blob:', e);
        // Fallback au format standard si fetch échoue
        formData.append('file', { uri: fileUri, name: filename, type });
      }
    } else {
      // Format standard pour React Native (Mobile)
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: type,
      });
    }
    
    formData.append('bucket', bucket);

    return apiService.request('/storage/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

export default apiService;
