const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// --- SYSTEM MIDDLEWARE CONFIGURATION ---
app.use(cors());
app.use(express.json());

// --- ENVIRONMENT VARIABLES (With hardcoded fallbacks for safe local execution) ---
// --- ENVIRONMENT VARIABLES ---
const PORT = process.env.PORT || 5000;

// PASTE YOUR ATLAS LINK DIRECTLY HERE:
const MONGO_URI = 'mongodb+srv://gabhilashy:abhi12345@complaintcluster.z24j58u.mongodb.net/?appName=ComplaintCluster';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_system_token_key_123';

// MASTER ADMIN PARAMETER CONTROL
const SUPER_ADMIN_EMAIL = 'gabhilashadmin@gmail.com';

// --- 1. SCHEMAS & DATABASE MODELS ---

// User Schema Infrastructure
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  loginCount: { type: Number, default: 0 } // Tracks logins dynamically
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Complaint Schema Infrastructure
const complaintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  domain: { type: String, enum: ['Campus', 'Civic', 'Company'], default: 'Campus' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' }
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);


// --- 2. SECURITY GUARDRAIL MIDDLEWARE (protect) ---
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Authorization rejected: Identity signature lost.' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Authorization rejected: Session token expired.' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Authorization rejected: No payload token attached.' });
  }
};


// --- 3. CORE ROUTING CONTROLLERS ---

// [AUTH] Register Profile
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // RULE INTERCEPT: Only let your specific email register as an admin
    if (role === 'admin' && email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ message: 'Registration Rejected: Only the system owner can establish an Administrator profile.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Account profile already exists with this email address.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      loginCount: 1 // Init first login instantly
    });

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Server compilation fault during profile registration.' });
  }
});

// [AUTH] Login Session
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await bcrypt.compare(password, user.password))) {
      
      // RULE INTERCEPT: Prevent standard profiles masquerading with an admin designation
      if (user.role === 'admin' && user.email !== SUPER_ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Unauthorized Access: You cannot login as an administrator.' });
      }

      // Increment tracking telemetry log metrics upon success
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Access keys do not match.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server execution failure processing login access.' });
  }
});

// [COMPLAINTS] Fetch Live Tracking Matrix Streams
app.get('/api/complaints', protect, async (req, res) => {
  try {
    // If you are the master admin, pull all records globally. If not, isolate to that user's tickets only.
    if (req.user.email === SUPER_ADMIN_EMAIL) {
      const allTickets = await Complaint.find().populate('user', 'name email').sort({ createdAt: -1 });
      return res.json(allTickets);
    } else {
      const userTickets = await Complaint.find({ user: req.user._id }).populate('user', 'name email').sort({ createdAt: -1 });
      return res.json(userTickets);
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to synchronize live tracking complaints stream.' });
  }
});

// [COMPLAINTS] File/Dispatch New Ticket Packet
app.post('/api/complaints', protect, async (req, res) => {
  try {
    const { title, description, domain, priority } = req.body;
    const freshComplaint = await Complaint.create({
      user: req.user._id,
      title,
      description,
      domain,
      priority
    });
    res.status(201).json(freshComplaint);
  } catch (err) {
    res.status(500).json({ message: 'Could not write complaint parameters to cluster.' });
  }
});

// [COMPLAINTS] Operational Actions: Acknowledge (In Progress)
app.put('/api/complaints/:id/acknowledge', protect, async (req, res) => {
  try {
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access Denied: Action restricted to System Owner.' });
    }
    const ticket = await Complaint.findByIdAndUpdate(req.params.id, { status: 'In Progress' }, { new: true });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Status updating protocol dropped.' });
  }
});

// [COMPLAINTS] Operational Actions: Resolve (Closed)
app.put('/api/complaints/:id/resolve', protect, async (req, res) => {
  try {
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access Denied: Action restricted to System Owner.' });
    }
    const ticket = await Complaint.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Status updating protocol dropped.' });
  }
});

// [COMPLAINTS] Standard Fallback Update Endpoint Route
app.put('/api/complaints/:id', protect, async (req, res) => {
  try {
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access Denied: Action restricted to System Owner.' });
    }
    const { status } = req.body;
    const ticket = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Standard update fallback failed.' });
  }
});


// --- INTEGRATED METRICS DATABASE ENDPOINT ---
// This handles your Requirement 3, providing full user analytics directly to your Admin panel.
app.get('/api/users/metrics', protect, async (req, res) => {
  try {
    // Only allow your master admin account to query data metrics
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access Denied: Master Administration privilege required.' });
    }

    // Query all users from the cluster database (hiding passwords for core security compliance)
    const users = await User.find({}, '-password');
    
    // Compile aggregate metrics mapping over current database record metrics
    const userMetrics = await Promise.all(users.map(async (u) => {
      const ticketCount = await Complaint.countDocuments({ user: u._id });
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        loginCount: u.loginCount || 1, // Fallback if user existed prior to tracking updates
        complaintsFiled: ticketCount
      };
    }));

    res.json(userMetrics);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Metrics database stream dropped.' });
  }
});


// --- 4. DATA ENGINE INITIALIZATION SYSTEM ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('🏁 Connected to MongoDB Database Hub Cluster.');
    app.listen(PORT, () => {
      console.log(`🚀 Server processing data pipelines safely on Port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Data Engine Pipeline Error on Initialization:', err.message);
  });