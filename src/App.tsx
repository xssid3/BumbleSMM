import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { NotificationController } from "@/components/NotificationController";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Orders from "./pages/dashboard/Orders";
import AddFunds from "./pages/dashboard/AddFunds";
import Settings from "./pages/dashboard/Settings";
import AdminServices from "./pages/admin/AdminServices";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Toaster />
        <Sonner />
        <NotificationController />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardHome /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute><DashboardLayout><Orders /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/add-funds" element={<ProtectedRoute><DashboardLayout><AddFunds /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute><DashboardLayout><AdminServices /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><DashboardLayout><AdminUsers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute><DashboardLayout><AdminOrders /></DashboardLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
