app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: 'SyncCivic API is running smoothly',
    endpoints: {
      complaints: '/api/complaints',
      auth: '/api/auth/login',
      alerts: '/api/alerts/send-cutdown'
    }
  });
});
app.get('/api/complaints', (req, res) => {
  // 1. Run auto-escalation check
  COMPLAINTS = COMPLAINTS.map(c => {
    if (c.status !== 'RESOLVED') {
      if (c.tags.includes('#FastTrack') || c.upvotes >= 30) {
        if (c.assignedLevel === 'FIELD_INSPECTOR') c.assignedLevel = 'ASSISTANT_ENGINEER';
        else if (c.upvotes >= 50 && c.assignedLevel === 'ASSISTANT_ENGINEER') {
          c.assignedLevel = 'EXECUTIVE_ENGINEER';
        }
      }
    }
    return c;
  });

  // 2. Optional token check: if logged in as an official, filter by hierarchy
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'official') {
        const levelOrder = { FIELD_INSPECTOR: 1, ASSISTANT_ENGINEER: 2, EXECUTIVE_ENGINEER: 3 };
        const userRank = levelOrder[decoded.level] || 1;
        const visible = COMPLAINTS.filter(c => (levelOrder[c.assignedLevel] || 1) <= userRank);
        return res.json(visible);
      }
    } catch (err) {
      // If token is invalid or expired, continue as public visitor
    }
  }

  // 3. Unauthenticated public visitors see all complaints
  return res.json(COMPLAINTS);
});
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-super-secret-key-123';

// Optional Twilio setup (falls back to clean console simulator if keys are missing)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ------------------- IN-MEMORY DATA STORE -------------------
const USERS = [
  { id: 1, email: 'citizen@city.gov', password: '123', role: 'public', name: 'Citizen User' },
  { id: 2, email: 'inspector@city.gov', password: '123', role: 'official', level: 'FIELD_INSPECTOR', name: 'Officer Raman' },
  { id: 3, email: 'ae@city.gov', password: '123', role: 'official', level: 'ASSISTANT_ENGINEER', name: 'AE Priya' },
  { id: 4, email: 'ee@city.gov', password: '123', role: 'official', level: 'EXECUTIVE_ENGINEER', name: 'EE Sundaram' }
];

let COMPLAINTS = [
  {
    id: 101,
    title: 'Severe pipeline leak after road trenching',
    location: 'Ward 12, Main Street',
    tags: ['#FastTrack', '#WaterCut'],
    upvotes: 42,
    status: 'PENDING',
    assignedLevel: 'ASSISTANT_ENGINEER', // Auto-escalated due to #FastTrack & high upvotes
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    id: 102,
    title: 'Debris left on walkway after cabling work',
    location: 'Cross Road 4',
    tags: ['#RoadHazard'],
    upvotes: 8,
    status: 'IN_REVIEW',
    assignedLevel: 'FIELD_INSPECTOR',
    createdAt: new Date().toISOString()
  }
];

// ------------------- AUTH MIDDLEWARE -------------------
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ------------------- 1. AUTH ROUTES -------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, level: user.level, name: user.name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  return res.json({ token, user: { name: user.name, role: user.role, level: user.level } });
});

// ------------------- 2. HIERARCHICAL COMPLAINTS & ESCALATION -------------------
app.get('/api/complaints', authenticate, (req, res) => {
  // Evaluation of auto-escalation rule
  COMPLAINTS = COMPLAINTS.map(c => {
    if (c.status !== 'RESOLVED') {
      if (c.tags.includes('#FastTrack') || c.upvotes >= 30) {
        if (c.assignedLevel === 'FIELD_INSPECTOR') c.assignedLevel = 'ASSISTANT_ENGINEER';
        else if (c.upvotes >= 50 && c.assignedLevel === 'ASSISTANT_ENGINEER') {
          c.assignedLevel = 'EXECUTIVE_ENGINEER';
        }
      }
    }
    return c;
  });

  // Filter based on official rank hierarchy
  if (req.user.role === 'official') {
    const levelOrder = { FIELD_INSPECTOR: 1, ASSISTANT_ENGINEER: 2, EXECUTIVE_ENGINEER: 3 };
    const userRank = levelOrder[req.user.level] || 1;
    // Officials see tickets escalated up to their tier
    const visible = COMPLAINTS.filter(c => (levelOrder[c.assignedLevel] || 1) <= userRank);
    return res.json(visible);
  }

  // Public users see all complaints
  return res.json(COMPLAINTS);
});

// Escalate or Resolve complaint
app.patch('/api/complaints/:id/action', authenticate, (req, res) => {
  const { id } = req.params;
  const { action, nextLevel } = req.body;
  const complaint = COMPLAINTS.find(c => c.id === parseInt(id));
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  if (action === 'ESCALATE') complaint.assignedLevel = nextLevel || 'EXECUTIVE_ENGINEER';
  if (action === 'RESOLVE') complaint.status = 'RESOLVED';

  return res.json({ message: 'Complaint updated', complaint });
});

// ------------------- 3. WHATSAPP DISRUPTION ALERTS -------------------
app.post('/api/alerts/send-cutdown', authenticate, async (req, res) => {
  const { ward, cutdownType, scheduledDate, message } = req.body;
  const alertText = `🚨 *CIVIC DISRUPTION NOTICE*\nType: ${cutdownType}\nWard/Area: ${ward}\nScheduled Date: ${scheduledDate}\nDetails: ${message}\n- Sent via SyncCivic Public Works System`;

  if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && process.env.TARGET_PHONE) {
    try {
      await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${process.env.TARGET_PHONE}`,
        body: alertText
      });
      return res.json({ success: true, mode: 'LIVE_WHATSAPP', preview: alertText });
    } catch (err) {
      console.error('Twilio Error:', err.message);
    }
  }

  // Fallback simulator for judge demonstration
  console.log('--- [SIMULATED WHATSAPP DISPATCH] ---');
  console.log(alertText);
  console.log('--------------------------------------');
  return res.json({ success: true, mode: 'SIMULATED', preview: alertText });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Endpoint for Person 1 to post a new citizen complaint
app.post('/api/complaints', (req, res) => {
  const { title, location, tags, ward } = req.body;
  const newComplaint = {
    id: COMPLAINTS.length + 101,
    title,
    location,
    tags: tags || [],
    ward: ward || 'Ward 12',
    upvotes: 0,
    status: 'PENDING',
    assignedLevel: tags?.includes('#FastTrack') ? 'ASSISTANT_ENGINEER' : 'FIELD_INSPECTOR',
    createdAt: new Date().toISOString()
  };
  COMPLAINTS.unshift(newComplaint);
  res.status(201).json(newComplaint);
});

// Endpoint for Person 1's upvote button
app.post('/api/complaints/:id/upvote', (req, res) => {
  const complaint = COMPLAINTS.find(c => c.id === parseInt(req.params.id));
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  
  complaint.upvotes += 1;
  // Trigger auto-escalation thresholds
  if (complaint.upvotes >= 30 && complaint.assignedLevel === 'FIELD_INSPECTOR') {
    complaint.assignedLevel = 'ASSISTANT_ENGINEER';
  } else if (complaint.upvotes >= 50 && complaint.assignedLevel === 'ASSISTANT_ENGINEER') {
    complaint.assignedLevel = 'EXECUTIVE_ENGINEER';
  }
  res.json({ id: complaint.id, upvotes: complaint.upvotes, assignedLevel: complaint.assignedLevel });
});