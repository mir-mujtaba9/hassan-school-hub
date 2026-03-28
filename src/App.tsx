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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAppContext();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { isLoggedIn } = useAppContext();
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/admission" replace /> : <Login />} />
      <Route path="/" element={<Navigate to="/admission" replace />} />
      <Route path="/admission" element={<ProtectedRoute><StudentAdmission /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><StudentAdmission /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsList /></ProtectedRoute>} />
      <Route path="/fees" element={<ProtectedRoute><FeeCollection /></ProtectedRoute>} />
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
