import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Explicitly clean up data values before transmitting
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      role: role
    };

    try {
      // Sends the request to your backend engine running on port 5000
      const res = await axios.post('http://localhost:5000/api/auth/register', payload);
      
      // Saves the returned user token structure to localStorage
      localStorage.setItem('user', JSON.stringify(res.data));
      
      // Routes past the auth wall into your dashboard portal interface
      navigate('/dashboard');
    } catch (err) {
      // Catches and renders database response messages directly in the red alert box
      setError(err.response?.data?.message || 'Registration Processing Error');
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' }}>
      <div className="auth-box" style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
        <h2 style={{ textAlign: 'center', color: '#06b6d4', marginBottom: '10px', fontSize: '28px', fontWeight: 'bold' }}>Establish Account</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginBottom: '25px' }}>
          Access Control Configuration
        </p>

        {/* Dynamic Error Block Banner */}
        {error && (
          <div className="error-box" style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '14px',
            marginBottom: '20px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '14px' }}>Full Identity Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Abhilash Yadav"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '14px' }}>Email Workspace Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="abhi@gmail.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '14px' }}>System Access Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Minimum 6 characters"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

<div className="form-group">
  <label>Functional Network Assignment Track</label>
  <select 
    value={role} 
    onChange={(e) => setRole(e.target.value)}
    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}
  >
    {/* These values MUST be lowercase 'user' or 'admin' for MongoDB to accept them */}
    <option value="user">Standard User (Log Grievance)</option>
    <option value="admin">System Administrator (Resolution Executive)</option>
  </select>
</div>

          <button 
            type="submit" 
            className="btn" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#10b981', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.2s'
            }}
          >
            Register Account Profile
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          Already have verified configurations? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>Log In here</Link>
        </p>
      </div>
    </div>
  );
}