import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireRole from './auth/RequireRole';
import RequireAdminMfa from './auth/RequireAdminMfa';
import RequireCoachCapability from './auth/RequireCoachCapability';
import RequireActiveSubscription from './auth/RequireActiveSubscription';
import RequirePlayerDetails from './auth/RequirePlayerDetails';
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
import CoachChatInbox from './routes/coach/ChatInbox';
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
import SectionLibrary from './routes/coach/SectionLibrary';
import TaskLibrary from './routes/coach/TaskLibrary';
import FormLibrary from './routes/coach/FormLibrary';
import MealPlanLibrary from './routes/coach/MealPlanLibrary';
import RecipeLibrary from './routes/coach/RecipeLibrary';
import IngredientLibrary from './routes/coach/IngredientLibrary';
import RecipeBookLibrary from './routes/coach/RecipeBookLibrary';
import MetricGroupLibrary from './routes/coach/MetricGroupLibrary';
import CoachTeam from './routes/coach/Team';
import CoachSubs from './routes/coach/Subs';
import PlayerProgram from './routes/player/Program';
import PlayerAnalysis from './routes/player/Analysis';
import PlayerChat from './routes/player/Chat';
import PlayerDiet from './routes/player/Diet';
import PlayerDietProgress from './routes/player/DietProgress';
import Blocked from './routes/player/Blocked';
import PlayerProfileDetails from './routes/player/Profile';
import AdminCoaches from './routes/admin/Coaches';
import AdminSupport from './routes/admin/Support';
import DesignPreview from './routes/DesignPreview';

const coachLinks = [
  { to: '/coach/dashboard', label: 'Dashboard', badgeKey: 'chat' as const },
  { to: '/coach/exercise-library', label: 'Exercises', group: 'library' as const },
  { to: '/coach/workout-library', label: 'Workouts', group: 'library' as const },
  { to: '/coach/section-library', label: 'Sections', group: 'library' as const },
  { to: '/coach/program-library', label: 'Programs', group: 'library' as const },
  { to: '/coach/task-library', label: 'Tasks', group: 'library' as const },
  { to: '/coach/form-library', label: 'Forms', group: 'library' as const },
  { to: '/coach/meal-plan-library', label: 'Meal Plans', group: 'library' as const },
  { to: '/coach/recipe-library', label: 'Recipes', group: 'library' as const },
  { to: '/coach/ingredient-library', label: 'Ingredients', group: 'library' as const },
  { to: '/coach/recipe-book-library', label: 'Recipe Books', group: 'library' as const },
  { to: '/coach/metric-group-library', label: 'Metric Groups', group: 'library' as const },
  { to: '/coach/checkups', label: 'Check-ups' },
  { to: '/coach/messages', label: 'Messages', badgeKey: 'chat' as const },
  { to: '/coach/team', label: 'Team' },
  { to: '/coach/subs', label: 'Subs' },
  { to: '/coach/settings', label: 'Settings' },
  { to: '/coach/support', label: 'Support', badgeKey: 'support' as const },
];
const playerLinks = [
  { to: '/player/program', label: 'Program' },
  { to: '/player/diet', label: 'Diet' },
  { to: '/player/analysis', label: 'Progress' },
  { to: '/player/diet-progress', label: 'Diet Progress' },
  { to: '/player/chat', label: 'Chat', badgeKey: 'chat' as const },
  { to: '/player/profile', label: 'My Profile' },
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
          <Route path="/design-preview/:view" element={<DesignPreview />} />

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
            <Route path="exercise-library" element={<RequireCoachCapability capability="owner"><CoachExerciseLibrary /></RequireCoachCapability>} />
            <Route path="workout-library" element={<RequireCoachCapability capability="owner"><CoachWorkoutLibrary /></RequireCoachCapability>} />
            <Route path="section-library" element={<RequireCoachCapability capability="owner"><SectionLibrary /></RequireCoachCapability>} />
            <Route path="program-library" element={<RequireCoachCapability capability="owner"><CoachProgramLibrary /></RequireCoachCapability>} />
            <Route path="task-library" element={<RequireCoachCapability capability="owner"><TaskLibrary /></RequireCoachCapability>} />
            <Route path="form-library" element={<RequireCoachCapability capability="owner"><FormLibrary /></RequireCoachCapability>} />
            <Route path="meal-plan-library" element={<RequireCoachCapability capability="owner"><MealPlanLibrary /></RequireCoachCapability>} />
            <Route path="recipe-library" element={<RequireCoachCapability capability="owner"><RecipeLibrary /></RequireCoachCapability>} />
            <Route path="ingredient-library" element={<RequireCoachCapability capability="owner"><IngredientLibrary /></RequireCoachCapability>} />
            <Route path="recipe-book-library" element={<RequireCoachCapability capability="owner"><RecipeBookLibrary /></RequireCoachCapability>} />
            <Route path="metric-group-library" element={<RequireCoachCapability capability="owner"><MetricGroupLibrary /></RequireCoachCapability>} />
            <Route path="players/:playerId" element={<CoachPlayerProfile />} />
            <Route path="players/:playerId/program" element={<RequireCoachCapability capability="manage"><ProgramBuilder /></RequireCoachCapability>} />
            <Route path="players/:playerId/diet" element={<RequireCoachCapability capability="manage"><CoachDiet /></RequireCoachCapability>} />
            <Route path="players/:playerId/analysis" element={<CoachPlayerAnalysis />} />
            <Route path="players/:playerId/diet-progress" element={<CoachDietProgress />} />
            <Route path="players/:playerId/messages" element={<RequireCoachCapability capability="chat"><CoachMessages /></RequireCoachCapability>} />
            <Route path="players/:playerId/chat" element={<RequireCoachCapability capability="chat"><CoachChat /></RequireCoachCapability>} />
            <Route path="messages" element={<RequireCoachCapability capability="chat"><CoachChatInbox /></RequireCoachCapability>} />
            <Route path="checkups" element={<RequireCoachCapability capability="manage"><Checkups /></RequireCoachCapability>} />
            <Route path="team" element={<RequireCoachCapability capability="owner"><CoachTeam /></RequireCoachCapability>} />
            <Route path="subs" element={<RequireCoachCapability capability="sell"><CoachSubs /></RequireCoachCapability>} />
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
            <Route path="program" element={<RequireActiveSubscription><RequirePlayerDetails><PlayerProgram /></RequirePlayerDetails></RequireActiveSubscription>} />
            <Route path="diet" element={<RequireActiveSubscription><RequirePlayerDetails><PlayerDiet /></RequirePlayerDetails></RequireActiveSubscription>} />
            <Route path="analysis" element={<RequireActiveSubscription><RequirePlayerDetails><PlayerAnalysis /></RequirePlayerDetails></RequireActiveSubscription>} />
            <Route path="diet-progress" element={<RequireActiveSubscription><RequirePlayerDetails><PlayerDietProgress /></RequirePlayerDetails></RequireActiveSubscription>} />
            <Route path="chat" element={<RequireActiveSubscription><RequirePlayerDetails><PlayerChat /></RequirePlayerDetails></RequireActiveSubscription>} />
            <Route path="profile" element={<RequireActiveSubscription><PlayerProfileDetails /></RequireActiveSubscription>} />
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
