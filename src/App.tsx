import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireRole from './auth/RequireRole';
import RequireActiveSubscription from './auth/RequireActiveSubscription';
import AppLayout from './layouts/AppLayout';

import Landing from './routes/Landing';
import Terms from './routes/Terms';
import CoachLogin from './routes/auth/CoachLogin';
import PlayerLogin from './routes/auth/PlayerLogin';
import AdminLogin from './routes/auth/AdminLogin';
import CoachSignup from './routes/auth/CoachSignup';
import PlayerSignup from './routes/auth/PlayerSignup';

import CoachDashboard from './routes/coach/Dashboard';
import ProgramBuilder from './routes/coach/ProgramBuilder';
import CoachMessages from './routes/coach/Messages';
import CoachChat from './routes/coach/Chat';
import Checkups from './routes/coach/Checkups';
import CoachPlayerAnalysis from './routes/coach/PlayerAnalysis';
import CoachDiet from './routes/coach/Diet';
import CoachSettings from './routes/coach/Settings';
import PlayerProgram from './routes/player/Program';
import PlayerAnalysis from './routes/player/Analysis';
import PlayerChat from './routes/player/Chat';
import PlayerDiet from './routes/player/Diet';
import Blocked from './routes/player/Blocked';
import AdminCoaches from './routes/admin/Coaches';

const coachLinks = [
  { to: '/coach/dashboard', label: 'Dashboard' },
  { to: '/coach/checkups', label: 'Check-ups' },
  { to: '/coach/settings', label: 'Settings' },
];
const playerLinks = [
  { to: '/player/program', label: 'Program' },
  { to: '/player/diet', label: 'Diet' },
  { to: '/player/analysis', label: 'Progress' },
  { to: '/player/chat', label: 'Chat' },
];
const adminLinks = [
  { to: '/admin/coaches', label: 'Users & Keys' },
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login/coach" element={<CoachLogin />} />
          <Route path="/login/player" element={<PlayerLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/signup/coach" element={<CoachSignup />} />
          <Route path="/signup/player" element={<PlayerSignup />} />

          {/* Coach */}
          <Route
            path="/coach"
            element={
              <RequireRole role="coach">
                <AppLayout links={coachLinks} />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CoachDashboard />} />
            <Route path="players/:playerId/program" element={<ProgramBuilder />} />
            <Route path="players/:playerId/diet" element={<CoachDiet />} />
            <Route path="players/:playerId/analysis" element={<CoachPlayerAnalysis />} />
            <Route path="players/:playerId/messages" element={<CoachMessages />} />
            <Route path="players/:playerId/chat" element={<CoachChat />} />
            <Route path="checkups" element={<Checkups />} />
            <Route path="settings" element={<CoachSettings />} />
          </Route>

          {/* Player */}
          <Route
            path="/player"
            element={
              <RequireRole role="player">
                <AppLayout links={playerLinks} />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="program" replace />} />
            <Route path="program" element={<RequireActiveSubscription><PlayerProgram /></RequireActiveSubscription>} />
            <Route path="diet" element={<RequireActiveSubscription><PlayerDiet /></RequireActiveSubscription>} />
            <Route path="analysis" element={<RequireActiveSubscription><PlayerAnalysis /></RequireActiveSubscription>} />
            <Route path="chat" element={<RequireActiveSubscription><PlayerChat /></RequireActiveSubscription>} />
            <Route path="blocked" element={<Blocked />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AppLayout links={adminLinks} />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="coaches" replace />} />
            <Route path="coaches" element={<AdminCoaches />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
