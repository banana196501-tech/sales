import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SalesProvider } from '@/contexts/SalesContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// Components
import LoginPage from '@/components/auth/LoginPage';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import LeadsPage from '@/components/leads/LeadsPage';
import PipelinePage from '@/components/pipeline/PipelinePage';
import WhatsAppPage from '@/components/broadcast/WhatsAppPage';
import EmailPage from '@/components/broadcast/EmailPage';
import TasksPage from '@/components/tasks/TasksPage';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';
import SettingsPage from '@/components/settings/SettingsPage';



const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Get current path for header title
  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPath}
        onNavigate={(page) => navigate(`/${page}`)}
        isOpen={isMobile ? sidebarOpen : sidebarExpanded}
        onToggle={() => isMobile ? toggleSidebar() : setSidebarExpanded(!sidebarExpanded)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          title={t(currentPath)}
          onMenuClick={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <AuthProvider>
      <SalesProvider>
        <MainApp />
      </SalesProvider>
    </AuthProvider>
  );
};

export default AppLayout;
