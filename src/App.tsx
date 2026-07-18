import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireRole from './auth/RequireRole';
import RequireActiveSubscription from './auth/RequireActiveSubscription';
import RequireAdminMfa from './auth/RequireAdminMfa';
import AppLayout from './layouts/AppLayout';

import Landing from './routes/Landing';
import Terms from './routes/Terms';
import Changelog from './routes/Changelog';
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
import CoachSupport from './routes/coach/Support';
import CoachDietProgress from './routes/coach/DietProgress';
import CoachPlayerProfile from './routes/coach/PlayerProfile';
import CoachExerciseLibrary from './routes/coach/ExerciseLibrary';
import CoachWorkoutLibrary from './routes/coach/WorkoutLibrary';
import CoachProgramLibrary from './routes/coach/ProgramLibrary';
import PlayerProgram from './routes/player/Program';
import PlayerAnalysis from './routes/player/Analysis';
import PlayerChat from './routes/player/Chat';
import PlayerDiet from './routes/player/Diet';
import PlayerDietProgress from './routes/player/DietProgress';
import Blocked from './routes/player/Blocked';
import AdminCoaches from './routes/admin/Coaches';
import AdminSupport from './routes/admin/Support';

const coachLinks = [
  { to: '/coach/dashboard', label: 'Dashboard', badgeKey: 'chat' as const },
  { to: '/coach/exercise-library', label: 'Exercises', group: 'library' as const },
  { to: '/coach/workout-library', label: 'Workouts', group: 'library' as const },
  { to: '/coach/program-library', label: 'Programs', group: 'library' as const },
  { to: '/coach/checkups', label: 'Check-ups' },
  { to: '/coach/settings', label: 'Settings' },
  { to: '/coach/support', label: 'Support', badgeKey: 'support' as const },
];
const playerLinks = [
  { to: '/player/program', label: 'Program' },
  { to: '/player/diet', label: 'Diet' },
  { to: '/player/analysis', label: 'Progress' },
  { to: '/player/diet-progress', label: 'Diet Progress' },
  { to: '/player/chat', label: 'Chat', badgeKey: 'chat' as const },
];
const adminLinks = [
  { to: '/admin/coaches', label: 'Users & Keys' },
  { to: '/admin/support', label: 'Support', badgeKey: 'support' as const },
];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/changelog" element={<Changelog />} />
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
            <Route path="exercise-library" element={<CoachExerciseLibrary />} />
            <Route path="workout-library" element={<CoachWorkoutLibrary />} />
            <Route path="program-library" element={<CoachProgramLibrary />} />
            <Route path="players/:playerId" element={<CoachPlayerProfile />} />
            <Route path="players/:playerId/program" element={<ProgramBuilder />} />
            <Route path="players/:playerId/diet" element={<CoachDiet />} />
            <Route path="players/:playerId/analysis" element={<CoachPlayerAnalysis />} />
            <Route path="players/:playerId/diet-progress" element={<CoachDietProgress />} />
            <Route path="players/:playerId/messages" element={<CoachMessages />} />
            <Route path="players/:playerId/chat" element={<CoachChat />} />
            <Route path="checkups" element={<Checkups />} />
            <Route path="settings" element={<CoachSettings />} />
            <Route path="support" element={<CoachSupport />} />
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
            <Route path="diet-progress" element={<RequireActiveSubscription><PlayerDietProgress /></RequireActiveSubscription>} />
            <Route path="chat" element={<RequireActiveSubscription><PlayerChat /></RequireActiveSubscription>} />
            <Route path="blocked" element={<Blocked />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <RequireAdminMfa>
                  <AppLayout links={adminLinks} />
                </RequireAdminMfa>
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="coaches" replace />} />
            <Route path="coaches" element={<AdminCoaches />} />
            <Route path="support" element={<AdminSupport />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
