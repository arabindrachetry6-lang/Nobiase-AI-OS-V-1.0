import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Website from './pages/Website';
import Sales from './pages/Sales';
import Marketing from './pages/Marketing';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import HRM from './pages/HRM';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Team from './pages/Team';
import AIChatbot from './components/AIChatbot';
import OnboardingWizard from './components/OnboardingWizard';

function AppContent() {
  const { user, profile, loading, isManager, isOwner } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profile || !profile.onboardingCompleted) {
    return <OnboardingWizard user={user} onComplete={() => window.location.reload()} />;
  }

  return (
    <Layout profile={profile}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/website" element={<Website />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/marketing" element={<Marketing />} />
        
        {/* Manager/Owner Only */}
        <Route 
          path="/finance" 
          element={isManager ? <Finance /> : <Navigate to="/" />} 
        />
        <Route 
          path="/hrm" 
          element={isManager ? <HRM /> : <Navigate to="/" />} 
        />
        
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/services" element={<Services />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/team" element={isOwner ? <Team /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <AIChatbot />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
