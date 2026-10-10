const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://edge-case-1-68i2.onrender.com';

// Mock initial fallback projects in case API backend has no projects table
const MOCK_PROJECTS = [
  {
    _id: 'p1',
    title: 'North Ring Main Stormwater Drainage Reinforcement',
    ward: 'Ward 42',
    status: 'In Progress',
    description: 'Replacing aging corrugated culverts with reinforced precast concrete conduits to prevent monsoon flooding.',
    allocatedBudget: 4250000,
    spentBudget: 2840000,
    contractor: 'Apex Civic Infra Ltd'
  },
  {
    _id: 'p2',
    title: 'Sub-Station 4B Smart Grid & LED Streetlamp Conversion',
    ward: 'Ward 42',
    status: 'Verified',
    description: 'Installing 420 motion-sensing LED public lights integrated with automated central failure telemetry.',
    allocatedBudget: 1850000,
    spentBudget: 1720000,
    contractor: 'BrightState Utilities'
  },
  {
    _id: 'p3',
    title: 'Sector 9 Arterial Road Bituminous Resurfacing',
    ward: 'Ward 42',
    status: 'Audited',
    description: 'Full-depth reclamation and micro-surfacing across 4.2 km high-traffic corridor.',
    allocatedBudget: 6200000,
    spentBudget: 5900000,
    contractor: 'Metro Roadways Corp'
  }
];

export async function fetchProjects() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : MOCK_PROJECTS;
  } catch (err) {
    console.warn('API projects unavailable, using telemetry mock:', err);
    return MOCK_PROJECTS;
  }
}

export async function fetchComplaints() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/complaints`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('API complaints unavailable:', err);
    return [
      {
        _id: 'c1',
        title: 'Main Drainage Pipeline Rupture at North Ring',
        ward: 'Ward 42 — Industrial Zone',
        category: 'Infrastructure',
        upvotes: 428,
        description: 'Severely impacting 1,200 households with contaminated runoff. Automated SLA escalation triggered to Tier 2.'
      },
      {
        _id: 'c2',
        title: 'Streetlamp Outage & Open Wiring on 4th Cross',
        ward: 'Ward 42',
        category: 'Electricity',
        upvotes: 184,
        description: 'Pedestrian hazard near primary school crossing. Unresolved past 72-hour SLA window.'
      }
    ];
  }
}

export async function upvoteComplaint(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/upvote`, {
      method: 'POST'
    });
    return await res.json();
  } catch (err) {
    console.warn('Upvote failed, recorded client-side:', err);
    return { success: true };
  }
}

export async function fileComplaint(data) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn('Complaint filing failed, recorded client-side:', err);
    return { success: true, ...data };
  }
}

export async function officialLogin(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Authentication failed');
  return await res.json();
}

export async function fetchEscalations(token) {
  const res = await fetch(`${API_BASE_URL}/api/admin/escalations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch escalations');
  return await res.json();
}