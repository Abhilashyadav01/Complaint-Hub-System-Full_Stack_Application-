import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login' | 'register' | 'dashboard'
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');
  
  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('user');
  
  // Complaint Creation States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Campus');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    if (user) {
      setScreen('dashboard');
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/complaints`, config);
      setComplaints(res.data);
    } catch (err) {
      console.error('Error loading complaints details');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: loginEmail, password: loginPassword });
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login credentials rejected');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name: regName, email: regEmail, password: regPassword, role: regRole });
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration rejected');
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${API_URL}/complaints`, { title, description, domain, priority }, config);
      setTitle('');
      setDescription('');
      fetchComplaints();
    } catch (err) {
      alert('Error logging ticket');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/complaints/${id}`, { status }, config);
      fetchComplaints();
    } catch (err) {
      alert('Action unauthorized');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setScreen('login');
  };

  if (screen === 'login') {
    return (
      <div className="auth-container">
        <h2>Smart Complaint Hub - Sign In</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn">Authenticate Session</button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          New here? <a href="#" onClick={() => setScreen('register')}>Create account</a>
        </p>
      </div>
    );
  }

  if (screen === 'register') {
    return (
      <div className="auth-container">
        <h2>Create Account</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Access Track Role</label>
            <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
              <option value="user">Standard User (File Complaint)</option>
              <option value="admin">System Admin (Manage / Close Tickets)</option>
            </select>
          </div>
          <button type="submit" className="btn">Register Profile</button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Have an account? <a href="#" onClick={() => setScreen('login')}>Sign In</a>
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="navbar">
        <h2>🚀 Smart Complaint Management Control Panel</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Logged in as: <strong>{user?.name} ({user?.role})</strong></span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div className="grid">
        {/* Left Side: Users file complaints */}
        <div className="card">
          <h3>File an Official Complaint</h3>
          <form onSubmit={handleCreateComplaint}>
            <div className="form-group">
              <label>Complaint Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Server down, Broken Streetlight" />
            </div>
            <div className="form-group">
              <label>Target Domain</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                <option value="Campus">Campus</option>
                <option value="Civic">Civic</option>
                <option value="Company">Company</option>
              </select>
            </div>
            <div className="form-group">
              <label>Severity Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Detailed Description</label>
              <textarea rows="4" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide full systemic breakdown details..."></textarea>
            </div>
            <button type="submit" className="btn" style={{ background: '#10b981' }}>File Ticket</button>
          </form>
        </div>

        {/* Right Side: Display list of tickets */}
        <div className="card">
          <h3>Active Management Matrix ({complaints.length} Records)</h3>
          {complaints.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No complaints filed in this tracking workspace yet.</p>
          ) : (
            complaints.map((c) => (
              <div key={c._id} className="complaint-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4>{c.title} <span className={`badge badge-${c.priority}`}>{c.priority}</span></h4>
                  <span style={{ fontWeight: 'bold', color: c.status === 'Resolved' ? '#10b981' : '#f59e0b' }}>[{c.status}]</span>
                </div>
                <p style={{ fontSize: '14px', color: '#4b5563' }}>{c.description}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Scope Domain: <strong>{c.domain}</strong> | Filed By: {c.user?.name || 'You'}</p>
                
                {/* Admin Management Interface Controls */}
                {user.role === 'admin' && c.status !== 'Resolved' && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <span style={{ fontSize: '12px', marginRight: '10px', fontWeight: 'bold' }}>Admin Actions:</span>
                    {c.status === 'Open' && (
                      <button onClick={() => handleUpdateStatus(c._id, 'In Progress')} style={{ marginRight: '5px', background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Acknowledge</button>
                    )}
                    <button onClick={() => handleUpdateStatus(c._id, 'Resolved')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Mark Resolved</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}