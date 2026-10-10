// src/api/client.js

// When running under Vercel multi-service or reverse proxy, relative paths route directly to /api
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const api = {
  fetchProjects: () => fetch(`${API_BASE}/api/v1/projects`).then(res => res.json()),
  fetchComplaints: () => fetch(`${API_BASE}/api/v1/complaints`).then(res => res.json()),
  upvoteComplaint: (id) => fetch(`${API_BASE}/api/v1/complaints/${id}/upvote`, { method: "POST" }).then(res => res.json()),
  fetchDepartments: () => fetch(`${API_BASE}/api/v1/departments`).then(res => res.json()),
  detectClashes: () => fetch(`${API_BASE}/api/v1/clashes/detect`, { method: "POST" }).then(res => res.json()),
  listClashes: () => fetch(`${API_BASE}/api/v1/clashes`).then(res => res.json()),
  fetchJointTenders: () => fetch(`${API_BASE}/api/v1/tenders/joint`).then(res => res.json()),
};
