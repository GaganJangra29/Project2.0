// API base URL
const API_URL = 'http://localhost:3000/api';

// Store auth token
let authToken = localStorage.getItem('authToken');

// API Service
const api = {
  // Auth endpoints
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  // Location endpoints
  async updateLocation(latitude, longitude) {
    if (!authToken) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/location/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ latitude, longitude })
    });
    return response.json();
  },

  async getNearbyDrivers(latitude, longitude, maxDistance = 5000) {
    if (!authToken) throw new Error('Not authenticated');
    
    const response = await fetch(
      `${API_URL}/location/nearby-drivers?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    return response.json();
  },

  // Ride endpoints
  async requestRide(pickupLocation, destinationLocation, price) {
    if (!authToken) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/ride/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        pickupLocation,
        destinationLocation,
        price
      })
    });
    return response.json();
  },

  async getRideHistory() {
    if (!authToken) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/ride/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    return response.json();
  },

  async getActiveRide() {
    if (!authToken) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_URL}/ride/active`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    return response.json();
  }
};