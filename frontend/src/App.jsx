import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import SplashScreen from './pages/SplashScreen'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import Calculator from './pages/Calculator'
import Results from './pages/Results'
import Missions from './pages/Missions'
import Compensation from './pages/Compensation'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import AdminApp from './pages/admin/AdminApp'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen ocean-bg flex items-center justify-center">
        <div className="text-ocean-cyan animate-pulse text-2xl">🌊</div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/calculator" />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/results" element={<Results />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/compensation" element={<Compensation />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/auth" element={<Navigate to="/calculator" />} />
      <Route path="*" element={<Navigate to="/calculator" />} />
    </Routes>
  )
}

function RoutedApp() {
  const location = useLocation()
  if (location.pathname.startsWith('/admin')) {
    return <AdminApp />
  }
  return <AppRoutes />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
