import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register(formData);
      navigate('/dashboard'); // Direct user to dashboard upon signup success
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during account registration');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Create an Account</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Full Name:</label>
          <input type="text" style={{ width: '100%', padding: '8px', marginTop: '5px' }} required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
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
        <div style={{ marginBottom: '15px' }}>
          <label>Account Role:</label>
          <select style={{ width: '100%', padding: '8px', marginTop: '5px' }} value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })} >
            <option value="user">Standard User (File Complaints)</option>
            <option value="admin">System Administrator (Resolve Complaints)</option>
          </select>
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Sign Up
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Log in here</Link>
      </p>
    </div>
  );
};

export default Register;