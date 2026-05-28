import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h2>Welcome to the Dashboard, {user?.name || 'User'}!</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <p style={{ marginTop: '20px', color: '#666' }}>
        Account Role: <strong>{user?.role || 'user'}</strong>
      </p>
      <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center' }}>
        <h3>Your Complaints System is Coming Together!</h3>
        <p>In the next section, we will build out the layout to submit and view live civic tickets.</p>
      </div>
    </div>
  );
};

export default Dashboard;