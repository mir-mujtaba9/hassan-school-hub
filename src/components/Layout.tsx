import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, Users, DollarSign, LogOut, Menu, X, UserCheck, FileText, BarChart3 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import schoolLogo from '@/assets/school-logo.png';

const menuItems = [
  { title: 'Student Admission', path: '/admission', icon: UserPlus },
  { title: 'Students', path: '/students', icon: Users },
  { title: 'Fee Collection', path: '/fees', icon: DollarSign },
  { title: 'Staff & Salary', path: '/staff', icon: UserCheck },
  { title: 'Expenses', path: '/expenses', icon: FileText },
  { title: 'Balance Sheet', path: '/balance', icon: BarChart3 },
];

const pageTitles: Record<string, string> = {
  '/admission': 'New Student Admission',
  '/students': 'Students',
  '/fees': 'Fee Collection',
  '/staff': 'Staff & Salary',
  '/expenses': 'Expenses',
  '/balance': 'Balance Sheet',
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = location.pathname;
  // Handle edit route title
  let pageTitle = pageTitles[currentPath] || 'Dashboard';
  if (currentPath.startsWith('/edit/')) pageTitle = 'Edit Student';

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/login');
  };

  const navTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-navy flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo section */}
        <div className="p-5 flex flex-col items-center border-b border-sidebar-border">
          <img src={schoolLogo} alt="Hassan Public School" className="w-16 h-16 rounded-full bg-card/10 p-1" />
          <h1 className="text-card font-bold text-lg mt-3 text-center">Hassan Public School</h1>
          <p className="text-primary text-sm">Butmong</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || (item.path === '/admission' && currentPath.startsWith('/edit/'));
            return (
              <button
                key={item.path}
                onClick={() => navTo(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-card/70 hover:bg-sidebar-border hover:text-card'
                }`}
              >
                <item.icon size={20} />
                {item.title}
              </button>
            );
          })}
        </nav>

        {/* Footer motto */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-muted-foreground text-xs italic text-center">"I Shall Rise and Shine"</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 text-foreground">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">Admin</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 transition-colors">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
