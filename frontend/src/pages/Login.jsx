import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid log-in credentials.');
    }
  };

  return (
    <div className="auth-container">
      <h2 style={{ textAlign: 'center', color: '#2563eb' }}>🏛️ Smart Civic Hub</h2>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '-10px' }}>Complaint Management System</p>
      {error && <p style={{ color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button type="submit" className="btn">Sign In</button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        New to the platform? <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>Create an account</Link>
      </p>
    </div>
  );
}