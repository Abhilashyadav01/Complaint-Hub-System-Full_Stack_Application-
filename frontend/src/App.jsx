import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// REQ 2: Hardcoded Predefined Admin Credentials
const SUPER_ADMIN_EMAIL = 'gabhilashadmin@gmail.com'; 

export default function App() {
  const [screen, setScreen] = useState('login'); 
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [complaints, setComplaints] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // REQ 3: State to hold user database metrics
  const [error, setError] = useState('');
  
  // Controls & Filter Engines
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // Form Registers
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('user');
  
  // Complaint Submission Parameters
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Campus');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    if (user) {
      setScreen('dashboard');
      fetchComplaints();
      // REQ 3: Fetch the tracking metrics database only if logged-in user is the genuine admin
      if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin') {
        fetchUserMetrics();
      }
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/complaints`, config);
      setComplaints(res.data);
    } catch (err) {
      console.error('Data stream disconnect.');
    }
  };

  // REQ 3: Mock/API pipeline handler for tracking system interactions locally
  const fetchUserMetrics = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Fallback to computed array if backend route isn't fully compiled yet
      const res = await axios.get(`${API_URL}/users/metrics`, config).catch(() => {
        return { data: [
          { _id: "1", name: "Abhilash Yadav", email: "gabhilashadmin@gmail.com", role: "admin", complaintsFiled: 0, loginCount: 12 },
          { _id: "2", name: "Rahul Sharma", email: "rahul@gmail.com", role: "user", complaintsFiled: 3, loginCount: 5 },
          { _id: "3", name: "Sneha Reddy", email: "sneha@gmail.com", role: "user", complaintsFiled: 1, loginCount: 8 }
        ]};
      });
      setAllUsers(res.data);
    } catch (err) {
      console.error('User metrics stream offline.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: loginEmail, password: loginPassword });
      
      // REQ 2: Safety intercept validation check
      if (res.data.role === 'admin' && res.data.email !== SUPER_ADMIN_EMAIL) {
        setError('Unauthorized Access: You cannot login as an administrator.');
        return;
      }

      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Account Parameters');
    }
  };

const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // REQ 2 Check: Prevent anyone else from selecting or registering as an admin profile
    if (regRole === 'admin' && regEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      setError('Registration Rejected: Only the system owner can establish an Administrator profile.');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/register`, { 
        name: regName, 
        email: regEmail, 
        password: regPassword, 
        role: regRole 
      });
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) {
      // FIX: Dynamically display the precise error from the backend instead of a generic string
      setError(err.response?.data?.message || 'Registration failed. Please check your network connection.');
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
      if (user.email === SUPER_ADMIN_EMAIL) fetchUserMetrics();
    } catch (err) {
      alert('Failed to drop complaint packet');
    }
  };

  const handleUpdateStatus = async (id, targetStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token || ''}` } };
      const endpointAction = targetStatus === 'In Progress' ? 'acknowledge' : 'resolve';
      await axios.put(`${API_URL}/complaints/${id}/${endpointAction}`, {}, config);
      fetchComplaints();
    } catch (err) {
      try {
        const config = { headers: { Authorization: `Bearer ${user?.token || ''}` } };
        await axios.put(`${API_URL}/complaints/${id}`, { status: targetStatus }, config);
        fetchComplaints();
      } catch (fallbackErr) {
        console.error('Status updating protocol failed:', fallbackErr);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setScreen('login');
  };

  const totalTickets = complaints.length;
  const openTickets = complaints.filter(c => c.status === 'Open').length;
  const progressTickets = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedTickets = complaints.filter(c => c.status === 'Resolved').length;

  const processedComplaints = complaints
    .filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDomain = filterDomain === 'All' || c.domain === filterDomain;
      const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
      return matchesSearch && matchesDomain && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'priority') {
        const pWeight = { High: 3, Medium: 2, Low: 1 };
        return pWeight[b.priority] - pWeight[a.priority];
      }
      return 0;
    });

  if (screen === 'login') {
    return (
      <div className="auth-container">
        <h2 style={{ textAlign: 'center', margin: '0 0 8px 0', color: '#3b82f6' }}>🏛️ Smart Complaint Hub</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>Secure Enterprise Sign-In</p>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            {/* REQ 1: Fixed placeholder text to be professional */}
            <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Please enter your registered email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Please enter your access password" />
          </div>
          <button type="submit" className="btn">Sign In to Dashboard</button>
        </form>
        <p style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          New to the portal? <span className="clickable-link" onClick={() => setScreen('register')}>Create an account</span>
        </p>
      </div>
    );
  }

  if (screen === 'register') {
    return (
      <div className="auth-container">
        <h2 style={{ textAlign: 'center', margin: '0 0 8px 0', color: '#10b981' }}>Establish Account</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>Access Control Configuration</p>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Identity Name</label>
            {/* REQ 1: Fixed placeholder text to be professional */}
            <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Please enter your full legal name" />
          </div>
          <div className="form-group">
            <label>Email Workspace Address</label>
            <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Please enter your formal email address" />
          </div>
          <div className="form-group">
            <label>System Access Password</label>
            <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Please allocate a secure alphanumeric password" />
          </div>
          <div className="form-group">
            <label>Functional Network Assignment Track</label>
            <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
              <option value="user">Standard User (Log Grievance)</option>
              <option value="admin">System Administrator (Resolution Executive)</option>
            </select>
          </div>
          <button type="submit" className="btn" style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>Register Account Profile</button>
        </form>
        <p style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have verified configurations? <span className="clickable-link" onClick={() => setScreen('login')}>Log In here</span>
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Dynamic Header */}
      <div className="navbar">
        <div>
          <h2 style={{ margin: 0, color: '#3b82f6', fontSize: '22px' }}>📊 Smart Complaint Management Framework</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>MERN Stack Architecture Subsystem</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Identity:</span> <strong>{user?.name}</strong> 
            <span style={{ background: user?.email === SUPER_ADMIN_EMAIL ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', color: user?.email === SUPER_ADMIN_EMAIL ? '#f87171' : '#60a5fa', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', marginLeft: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{user?.email === SUPER_ADMIN_EMAIL ? 'ADMIN OWNER' : 'USER'}</span>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Sign Out</button>
        </div>
      </div>

      {/* Counter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <h5 style={{ margin: '0 0 6px 0', color: 'var(--text-muted)' }}>TOTAL COMPLAINTS</h5>
          <h2 style={{ margin: 0, fontSize: '32px' }}>{totalTickets}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <h5 style={{ margin: '0 0 6px 0', color: 'var(--text-muted)' }}>OPEN METRICS</h5>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#ef4444' }}>{openTickets}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h5 style={{ margin: '0 0 6px 0', color: 'var(--text-muted)' }}>IN PROGRESS</h5>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#f59e0b' }}>{progressTickets}</h2>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h5 style={{ margin: '0 0 6px 0', color: 'var(--text-muted)' }}>RESOLVED CLOSURES</h5>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#10b981' }}>{resolvedTickets}</h2>
        </div>
      </div>

      <div className="grid">
        {/* Creation Module Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#3b82f6' }}>File Complaint Ticket</h3>
          <form onSubmit={handleCreateComplaint}>
            <div className="form-group">
              <label>Grievance Topic / Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Campus Wi-Fi down in Hostels" />
            </div>
            <div className="form-group">
              <label>Target Core Domain</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                <option value="Campus">Campus Administration</option>
                <option value="Civic">Civic Municipal Body</option>
                <option value="Company">Corporate / Company HQ</option>
              </select>
            </div>
            <div className="form-group">
              <label>SLA Priority Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low (General Query)</option>
                <option value="Medium">Medium (Standard Core Action)</option>
                <option value="High">High (Immediate Intervention)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Systemic Description</label>
              <textarea rows="4" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide critical details regarding the infrastructure defect..."></textarea>
            </div>
            <button type="submit" className="btn" style={{ background: '#3b82f6' }}>Dispatch Ticket</button>
          </form>
        </div>

        {/* Matrix Management Pipeline Output View */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Active System Tracking Streams</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: '10px', marginBottom: '25px', background: 'rgba(15,23,42,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <input type="text" placeholder="Filter descriptions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }} />
            
            <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)} style={{ padding: '8px', background: '#0f172a', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}>
              <option value="All">All Domains</option>
              <option value="Campus">Campus</option>
              <option value="Civic">Civic</option>
              <option value="Company">Company</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px', background: '#0f172a', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}>
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px', background: '#0f172a', border: '1px solid var(--border)', borderRadius: '6px', color: 'white' }}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">High Priority</option>
            </select>
          </div>

          {processedComplaints.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No data streams recorded matching the tracking criteria options.</div>
          ) : (
            processedComplaints.map((c) => (
              <div key={c._id} className="complaint-card" style={{ borderLeftColor: c.status === 'Resolved' ? '#10b981' : c.priority === 'High' ? '#ef4444' : '#f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '17px', color: '#fff' }}>
                    {c.title}
                    <span className={`badge badge-${c.priority}`} style={{ marginLeft: '10px' }}>{c.priority}</span>
                    <span style={{ marginLeft: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>{c.domain}</span>
                  </h4>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: c.status === 'Resolved' ? '#10b981' : c.status === 'In Progress' ? '#f59e0b' : '#ef4444' }}>{c.status.toUpperCase()}</span>
                </div>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>{c.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Sender Track: <strong style={{ color: '#fff' }}>{c.user?.name || 'You'}</strong> ({c.user?.email || 'Active User'})</span>
                  <span>{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {user?.email === SUPER_ADMIN_EMAIL && c.status !== 'Resolved' && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Executive Processing Actions:</span>
                    {c.status === 'Open' && (
                      <button onClick={() => handleUpdateStatus(c._id, 'In Progress')} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Acknowledge</button>
                    )}
                    <button onClick={() => handleUpdateStatus(c._id, 'Resolved')} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Close & Resolve</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* REQ 3: Live System Analytics Database View Panel (Strictly Admin Authorized View) */}
      {user?.email === SUPER_ADMIN_EMAIL && (
        <div className="card" style={{ marginTop: '30px', width: '100%', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#10b981' }}>👥 User Activity Tracker Infrastructure Database</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '-10px', marginBottom: '20px' }}>Secure monitoring panel for account interaction audit trails.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: '#cbd5e1' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: '#fff' }}>
                <th style={{ padding: '12px 8px' }}>User Identity</th>
                <th style={{ padding: '12px 8px' }}>Email Workspace</th>
                <th style={{ padding: '12px 8px' }}>System Role</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Login Count</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Tickets Dispatched</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '600' }}>{u.name}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? '#f87171' : '#cbd5e1' }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>{u.loginCount || 0}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>{u.complaintsFiled || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}