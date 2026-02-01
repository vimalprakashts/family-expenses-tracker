import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import MonthlyTracker from './pages/MonthlyTracker';
import Schedules from './pages/Schedules';
import Accounts from './pages/Accounts';
import Loans from './pages/Loans';
import Investments from './pages/Investments';
import Insurance from './pages/Insurance';
import Lending from './pages/Lending';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Family from './pages/Family';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AuthCallback from './pages/auth/AuthCallback';

// Create a client with optimized settings for Supabase
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Enable structural sharing to prevent unnecessary re-renders (default is true)
      structuralSharing: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes - Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Main App Routes - Protected */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="budget" element={<Budget />} />
                <Route path="monthly-tracker" element={<MonthlyTracker />} />
                <Route path="schedules" element={<Schedules />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="loans" element={<Loans />} />
                <Route path="investments" element={<Investments />} />
                <Route path="insurance" element={<Insurance />} />
                <Route path="lending" element={<Lending />} />
                <Route path="documents" element={<Documents />} />
                <Route path="reports" element={<Reports />} />
                <Route path="family" element={<Family />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
