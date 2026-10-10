const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://edge-case-1-68i2.onrender.com';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth endpoints (Feature 3)
  login: (credentials) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Complaints & Forum endpoints (Feature 7 & 1)
  getComplaints: () => apiRequest('/api/complaints'),
  createComplaint: (data) =>
    apiRequest('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  upvoteComplaint: (id) =>
    apiRequest(`/api/complaints/${id}/upvote`, {
      method: 'POST',
    }),

  // Projects endpoint (Feature 6 & 2)
  getProjects: () => apiRequest('/api/projects').catch(() => null),
};