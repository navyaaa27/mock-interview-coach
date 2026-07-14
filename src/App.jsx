import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const SessionPage = lazy(() => import('./pages/SessionPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ReplayPage = lazy(() => import('./pages/ReplayPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const AppLayout = lazy(() => import('./components/AppLayout/AppLayout'))

function PageSkeleton() {
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <div className="skeleton-bar" style={{ width: '200px', height: '24px', background: '#334155', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
      <div className="skeleton-bar" style={{ width: '150px', height: '16px', background: '#334155', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
      <div className="skeleton-bar" style={{ width: '250px', height: '16px', background: '#334155', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
    </div>
  )
}


function RequireAuth({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

function RedirectIfAuth({ children }) {
  const { currentUser } = useAuth()
  if (currentUser) return <Navigate to="/dashboard" replace />
  return children
}

// Redirect logged-in users without a profile to /onboarding
function RequireProfile({ children }) {
  const { currentUser, profile } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (profile === null) return <Navigate to="/onboarding" replace />
  return children
}

// Onboarding is only for logged-in users who have NOT completed setup
function OnboardingGuard({ children }) {
  const { currentUser, profile } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (profile)      return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/signup" element={<RedirectIfAuth><SignupPage /></RedirectIfAuth>} />

      {/* Onboarding — standalone, no AppLayout sidebar */}
      <Route path="/onboarding" element={<OnboardingGuard><OnboardingPage /></OnboardingGuard>} />

      {/* New React Pages */}
      <Route 
        path="/progress" 
        element={
          <RequireProfile>
            <AppLayout>
              <ProgressPage />
            </AppLayout>
          </RequireProfile>
        } 
      />

      {/* React Dashboard (D.02) */}
      <Route
        path="/dashboard"
        element={
          <RequireProfile>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </RequireProfile>
        }
      />
      
      {/* React Replay Page */}
      <Route
        path="/replay/:sessionId"
        element={
          <RequireProfile>
            <AppLayout>
              <ReplayPage />
            </AppLayout>
          </RequireProfile>
        }
      />

      {/* Legacy views — named routes so the sidebar nav uses navigate() not window.location.href */}
      <Route
        path="/history"
        element={
          <RequireProfile>
            <AppLayout>
              <SessionPage view="history" />
            </AppLayout>
          </RequireProfile>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireProfile>
            <AppLayout>
              <SessionPage view="profile" />
            </AppLayout>
          </RequireProfile>
        }
      />

      {/* Legacy App Wrapper — session, interview, setup etc. */}
      <Route 
        path="*" 
        element={
          <RequireAuth>
            <AppLayout>
              <SessionPage />
            </AppLayout>
          </RequireAuth>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageSkeleton />}>
          <AppRoutes />
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App
