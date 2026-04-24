import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, Users, DollarSign, LogOut, Menu, X, UserCheck, FileText, BarChart3, Settings } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import schoolLogo from '@/assets/school-logo.png';

const allMenuItems = [
  { title: 'Student Admission', path: '/admission', icon: UserPlus, adminOnly: true },
  { title: 'Students', path: '/students', icon: Users, adminOnly: false },
  { title: 'Fee Collection', path: '/fees', icon: DollarSign, adminOnly: false },
  { title: 'Staff & Salary', path: '/staff', icon: UserCheck, adminOnly: true },
  { title: 'Expenses', path: '/expenses', icon: FileText, adminOnly: true },
  { title: 'Balance Sheet', path: '/balance', icon: BarChart3, adminOnly: true },
  { title: 'User Management', path: '/users', icon: Settings, adminOnly: true },
];

const pageTitles: Record<string, string> = {
  '/admission': 'New Student Admission',
  '/students': 'Students',
  '/fees': 'Fee Collection',
  '/staff': 'Staff & Salary',
  '/expenses': 'Expenses',
  '/balance': 'Balance Sheet',
  '/users': 'User Management',
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn, setAuthToken, setUserId, setUserEmail, userRole, userName, authToken } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = location.pathname;
  let pageTitle = pageTitles[currentPath] || 'Dashboard';
  if (currentPath.startsWith('/edit/')) pageTitle = 'Edit Student';

  const menuItems = allMenuItems.filter(item => {
    if (userRole === 'admin') return true;
    return !item.adminOnly;
  });

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      }
    } catch {
      // Ignore logout API errors and still clear local auth state.
    } finally {
      setAuthToken(null);
      setUserId(null);
      setUserEmail('');
      setIsLoggedIn(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('authToken');
        window.sessionStorage.removeItem('authToken');
        document.cookie = 'authToken=; Max-Age=0; path=/';
      }
      navigate('/login', { replace: true });
    }
  };

  const navTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-navy flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 flex flex-col items-center border-b border-sidebar-border">
          <img src={schoolLogo} alt="Hassan Public School" className="w-16 h-16 rounded-full" />
          <h1 className="text-card font-bold text-lg mt-3 text-center">Hassan Public School</h1>
          <p className="text-primary text-sm">Butmong</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || (item.path === '/admission' && currentPath.startsWith('/edit/'));
            return (
              <button
                key={item.path}
                onClick={() => navTo(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-card/70 hover:bg-sidebar-border hover:text-card'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-card rounded-r-full" />
                )}
                <item.icon size={20} />
                {item.title}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-muted-foreground text-xs italic text-center">"I Shall Rise and Shine"</p>
          <p className="text-muted-foreground/50 text-[10px] text-center mt-1">Version 1.0 — Phase 1</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 text-foreground">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">{userName}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground hidden sm:inline capitalize">{userRole}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors ml-1">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
