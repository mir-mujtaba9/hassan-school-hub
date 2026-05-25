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
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { isLoggedIn, userRole } = useAppContext();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/students" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { isLoggedIn, userRole } = useAppContext();
  const defaultRoute = userRole === 'teacher' || userRole === 'accountant' ? '/students' : '/admission';
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to={defaultRoute} replace /> : <Login />} />
      <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      <Route path="/admission" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><StudentAdmission /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><StudentAdmission /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsList /></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><FeeCollection /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute allowedRoles={['admin']}><StaffSalary /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><Expenses /></ProtectedRoute>} />
      <Route path="/balance" element={<ProtectedRoute allowedRoles={['admin']}><BalanceSheet /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
