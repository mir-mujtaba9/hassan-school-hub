import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useAppContext } from "@/context/AppContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import StudentAdmission from "@/pages/StudentAdmission";
import StudentsList from "@/pages/StudentsList";
import FeeCollection from "@/pages/FeeCollection";
import StaffSalary from "@/pages/StaffSalary";
import Expenses from "@/pages/Expenses";
import BalanceSheet from "@/pages/BalanceSheet";
import UserManagement from "@/pages/UserManagement";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { isLoggedIn, userRole } = useAppContext();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (adminOnly && userRole !== 'admin') return <Navigate to="/students" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { isLoggedIn, userRole } = useAppContext();
  const defaultRoute = userRole === 'teacher' ? '/students' : '/admission';
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to={defaultRoute} replace /> : <Login />} />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/admission" element={<ProtectedRoute adminOnly><StudentAdmission /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute adminOnly><StudentAdmission /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsList /></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><FeeCollection /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute adminOnly><StaffSalary /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute adminOnly><Expenses /></ProtectedRoute>} />
      <Route path="/balance" element={<ProtectedRoute adminOnly><BalanceSheet /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
