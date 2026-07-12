import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const SessionPage = lazy(() => import('./pages/SessionPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

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

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/signup" element={<RedirectIfAuth><SignupPage /></RedirectIfAuth>} />

      {/* New React Pages */}
      <Route 
        path="/progress" 
        element={
          <RequireAuth>
            <ProgressPage />
          </RequireAuth>
        } 
      />

      {/* React Dashboard (D.02) */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />

      {/* Legacy App Wrapper (/session, history, replay, setup) */}
      <Route 
        path="*" 
        element={
          <RequireAuth>
            <SessionPage />
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
