
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "./pages/NotFound";

// Pages/Components for routing
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import LeadsPage from "@/components/leads/LeadsPage";
import PipelinePage from "@/components/pipeline/PipelinePage";
import WhatsAppPage from "@/components/broadcast/WhatsAppPage";
import EmailPage from "@/components/broadcast/EmailPage";
import TasksPage from "@/components/tasks/TasksPage";
import AnalyticsPage from "@/components/analytics/AnalyticsPage";
import SettingsPage from "@/components/settings/SettingsPage";
import NotificationsPage from "@/components/notifications/NotificationsPage";
import LoginPage from "@/components/auth/LoginPage";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="whatsapp" element={<WhatsAppPage />} />
              <Route path="email" element={<EmailPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
