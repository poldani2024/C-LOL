import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('c-lol-driver-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('c-lol-driver-token');
      localStorage.removeItem('c-lol-driver-trip');
      window.location.href = '/expired';
    }
    return Promise.reject(err);
  }
);

export async function accessWithToken(token: string) {
  const res = await apiClient.post('/auth/driver/access', { token });
  return res.data.data;
}

export async function getMyTrip() {
  const res = await apiClient.get('/driver/trip');
  return res.data.data;
}

export async function updateTripStatus(notes?: string, lat?: number, lng?: number) {
  const res = await apiClient.put('/driver/trip/status', { notes, lat, lng });
  return res.data.data;
}

export async function sendLocation(lat: number, lng: number, speed?: number) {
  const res = await apiClient.post('/driver/trip/location', { lat, lng, speed });
  return res.data.data;
}

export async function addEvent(notes: string, lat?: number, lng?: number, photos?: string[]) {
  const res = await apiClient.post('/driver/trip/event', { notes, lat, lng, photos });
  return res.data.data;
}

export async function reportIncident(type: string, description: string, lat?: number, lng?: number) {
  const res = await apiClient.post('/driver/trip/incident', { type, description, lat, lng });
  return res.data.data;
}
