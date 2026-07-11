import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import AuthCallback from './pages/auth/AuthCallback';
import Dashboard from './pages/dashboard/Dashboard';
import Users from './pages/users/Users';
import ActivityLog from './pages/activity/ActivityLog';
import Contacts from './pages/contacts/Contacts';
import Deals from './pages/deals/Deals';
import DealsHistory from './pages/deals/DealsHistory';
import Tasks from './pages/tasks/Tasks';
import Communications from './pages/communications/Communications';
import Documents from './pages/documents/Documents';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import LegalPage from './pages/legal/LegalPage';

const App = () => (
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Navigate to="/settings?tab=profile" replace />} />
              <Route element={<ProtectedRoute permission="contacts:view" />}><Route path="/contacts" element={<Contacts />} /></Route>
              <Route element={<ProtectedRoute permission="deals:view" />}><Route path="/deals" element={<Deals />} /></Route>
              <Route element={<ProtectedRoute permission="deals:view" />}><Route path="/deals/history" element={<DealsHistory />} /></Route>
              <Route element={<ProtectedRoute permission="tasks:view" />}><Route path="/tasks" element={<Tasks />} /></Route>
              <Route element={<ProtectedRoute permission="communications:view" />}><Route path="/communications" element={<Communications />} /></Route>
              <Route element={<ProtectedRoute permission="documents:view" />}><Route path="/documents" element={<Documents />} /></Route>
              <Route element={<ProtectedRoute permission="reports:view" />}><Route path="/reports" element={<Reports />} /></Route>
              <Route element={<ProtectedRoute permission="users:view" />}><Route path="/users" element={<Users />} /></Route>
              <Route element={<ProtectedRoute permission="activity:view" />}><Route path="/activity" element={<ActivityLog />} /></Route>
              <Route path="/settings" element={<Settings />} />
              <Route path="/legal/:type" element={<LegalPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);

export default App;
