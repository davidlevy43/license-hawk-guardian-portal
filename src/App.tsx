
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LicenseProvider } from "@/context/LicenseContext";
import { NotificationProvider } from "@/context/NotificationContext";
import MainLayout from "@/components/layout/MainLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import LicensesPage from "./pages/LicensesPage";
import CalendarPage from "./pages/CalendarPage";
import NotificationsPage from "./pages/NotificationsPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LicenseProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/licenses" element={<LicensesPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </LicenseProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
