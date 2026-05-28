import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.login(formData);
      navigate('/dashboard'); // Direct user to dashboard upon confirmation
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password parameters');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Sign In</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email Address:</label>
          <input type="email" style={{ width: '100%', padding: '8px', marginTop: '5px' }} required
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input type="password" style={{ width: '100%', padding: '8px', marginTop: '5px' }} required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Log In
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        New to the network? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
};

export default Login;