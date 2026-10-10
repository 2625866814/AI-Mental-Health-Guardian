import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MentalHealthPage from './pages/MentalHealthPage';
import AstrologyPage from './pages/AstrologyPage';
import ArtTherapyPage from './pages/ArtTherapyPage';
import DiaryPage from './pages/DiaryPage';
import PersonalityPage from './pages/PersonalityPage';
import AdvisorPage from './pages/AdvisorPage';
import AdminPage from './pages/AdminPage';
import DreamAnalysisPage from './pages/DreamAnalysisPage';
import PerceptionPage from './pages/PerceptionPage';
import DigitalHumanPage from './pages/DigitalHumanPage';
import CampusDataPage from './pages/CampusDataPage';
import AchievementPage from './pages/AchievementPage';
import DataDashboardPage from './pages/DataDashboardPage';
import MoodCheckInPage from './pages/MoodCheckInPage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';

// 受保护的路由组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// 公开路由组件（已登录用户不能访问）
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      {/* 全屏路由 */}
      <Route path="/dashboard-screen" element={
        <ProtectedRoute>
          <DataDashboardPage />
        </ProtectedRoute>
      } />
      
      {/* 受保护的路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="mental-health" element={<MentalHealthPage />} />
        <Route path="astrology" element={<AstrologyPage />} />
        <Route path="art-therapy" element={<ArtTherapyPage />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="personality" element={<PersonalityPage />} />
        <Route path="advisor" element={<AdvisorPage />} />
        <Route path="dream" element={<DreamAnalysisPage />} />
        <Route path="perception" element={<PerceptionPage />} />
        <Route path="digital-human" element={<DigitalHumanPage />} />
        <Route path="campus" element={<CampusDataPage />} />
        <Route path="achievement" element={<AchievementPage />} />
        <Route path="mood" element={<MoodCheckInPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      
      {/* 404页面 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
