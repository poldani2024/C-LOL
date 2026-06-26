import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AccessPage from './pages/AccessPage';
import TripPage from './pages/TripPage';
import StatusUpdatePage from './pages/StatusUpdatePage';
import EvidencePage from './pages/EvidencePage';
import IncidentPage from './pages/IncidentPage';
import ExpiredPage from './pages/ExpiredPage';

function DriverRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('c-lol-driver-token');
  if (!token) return <Navigate to="/expired" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/access/:token" element={<AccessPage />} />
        <Route path="/expired" element={<ExpiredPage />} />
        <Route path="/" element={<DriverRoute><TripPage /></DriverRoute>} />
        <Route path="/update" element={<DriverRoute><StatusUpdatePage /></DriverRoute>} />
        <Route path="/evidence" element={<DriverRoute><EvidencePage /></DriverRoute>} />
        <Route path="/incident" element={<DriverRoute><IncidentPage /></DriverRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
