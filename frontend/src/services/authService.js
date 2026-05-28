import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Register User Account
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Login User Account
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Logout User Session
const logout = () => {
  localStorage.removeItem('user');
};

const authService = { register, login, logout };
export default authService;