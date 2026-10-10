const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-civic-secret-key-2026';

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (e) {
    console.log('Twilio SDK in simulator mode.');
  }
}

// In-Memory Seed Users
const USERS = [
  { id: 1, email: 'citizen@city.gov', password: '123', role: 'public', name: 'Citizen User' },
  { id: 2, email: 'inspector@city.gov', password: '123', role: 'official', level: 'FIELD_INSPECTOR', name: 'Field Officer Raman' },
  { id: 3, email: 'ae@city.gov', password: '123', role: 'official', level: 'ASSISTANT_ENGINEER', name: 'AE Priya' },
  { id: 4, email: 'ee@city.gov', password: '123', role: 'official', level: 'EXECUTIVE_ENGINEER', name: 'EE Sundaram' }
];

// Seed Complaints
let COMPLAINTS = [
  {
    id: 101,
    title: 'Severe pipeline leak causing waterlogging after road excavation',
    location: 'Ward 12, Main Bazaar Road',
    ward: 'Ward 12',
    tags: ['#FastTrack', '#WaterCut'],
    upvotes: 42,
    status: 'PENDING',
    assignedLevel: 'ASSISTANT_ENGINEER',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    id: 102,
    title: 'Debris left on walkway post optic fiber cabling work',
    location: 'Cross Road 4, Sector 3',
    ward: 'Ward 8',
    tags: ['#RoadHazard'],
    upvotes: 8,
    status: 'IN_REVIEW',
    assignedLevel: 'FIELD_INSPECTOR',
    createdAt: new Date().toISOString()
  },
  {
    id: 103,
    title: 'Unrepaired trench across bus lane causing traffic congestion',
    location: 'Anna Salai Junction',
    ward: 'Ward 12',
    tags: ['#TrafficDisruption'],
    upvotes: 55,
    status: 'ESCALATED',
    assignedLevel: 'EXECUTIVE_ENGINEER',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
  }
];

// Middleware: Official Auth
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

// Root Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SyncCivic Public Works & Escalation API',
    version: '1.0.0',
    endpoints: ['/api/complaints', '/api/auth/login', '/api/alerts/send-cutdown']
  });
});

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, level: user.level, name: user.name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, level: user.level }
  });
});

// Complaints: Public Read + Tiered Filtering
app.get('/api/complaints', (req, res) => {
  // Auto-escalation checks
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
    } catch (e) {}
  }
  return res.json(COMPLAINTS);
});

// Upvote Complaint
app.post('/api/complaints/:id/upvote', (req, res) => {
  const complaint = COMPLAINTS.find(c => c.id === parseInt(req.params.id));
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  complaint.upvotes += 1;
  if (complaint.upvotes >= 30 && complaint.assignedLevel === 'FIELD_INSPECTOR') {
    complaint.assignedLevel = 'ASSISTANT_ENGINEER';
  } else if (complaint.upvotes >= 50 && complaint.assignedLevel === 'ASSISTANT_ENGINEER') {
    complaint.assignedLevel = 'EXECUTIVE_ENGINEER';
  }
  return res.json({ id: complaint.id, upvotes: complaint.upvotes, assignedLevel: complaint.assignedLevel });
});

// Action on Complaint (Escalate / Resolve)
app.patch('/api/complaints/:id/action', authenticate, (req, res) => {
  const complaint = COMPLAINTS.find(c => c.id === parseInt(req.params.id));
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const { action, nextLevel } = req.body;
  if (action === 'ESCALATE') {
    complaint.assignedLevel = nextLevel || 'EXECUTIVE_ENGINEER';
    complaint.status = 'ESCALATED';
  } else if (action === 'RESOLVE') {
    complaint.status = 'RESOLVED';
  }
  return res.json({ message: 'Complaint state updated', complaint });
});

// Disruption WhatsApp Alerts
app.post('/api/alerts/send-cutdown', authenticate, async (req, res) => {
  const { ward, cutdownType, scheduledDate, message } = req.body;
  const alertText = 
    `🚨 *CIVIC DISRUPTION NOTICE - SyncCivic*\n` +
    `Type: ${cutdownType || 'Utility Shutdown'}\n` +
    `Ward: ${ward || 'Ward 12'}\n` +
    `Scheduled: ${scheduledDate || 'Upcoming 24 Hours'}\n` +
    `Details: ${message || 'Pipeline maintenance under progress.'}\n` +
    `Advisory: Plan water storage and check alternate routes.`;

  if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && process.env.TARGET_PHONE) {
    try {
      await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${process.env.TARGET_PHONE}`,
        body: alertText
      });
      return res.json({ success: true, mode: 'LIVE_WHATSAPP', preview: alertText });
    } catch (err) {
      console.error(err.message);
    }
  }

  console.log('\n========= [SIMULATED WHATSAPP BROADCAST] =========');
  console.log(alertText);
  console.log('==================================================\n');
  return res.json({ success: true, mode: 'SIMULATED', preview: alertText });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SyncCivic API on port ${PORT}`));