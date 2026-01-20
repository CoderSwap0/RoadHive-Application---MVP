import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, PlusCircle, LogOut, Menu, Settings, Users, Box, Map, Moon, Sun } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../App';
import { Role } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (localStorage.getItem('theme') === 'dark') return true;
    if (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
  };

  const getNavItems = (role?: Role) => {
    const common = [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }];
    
    switch (role) {
      case 'SHIPPER':
        return [
          ...common,
          { name: 'My Loads', path: '/loads', icon: Truck },
          { name: 'Post Load', path: '/post-load', icon: PlusCircle },
        ];
      case 'TRANSPORTER':
        return [
          ...common,
          { name: 'Find Loads', path: '/loads', icon: Map },
          { name: 'My Fleet', path: '/fleet', icon: Truck },
        ];
      case 'DRIVER':
        return [
          ...common,
          { name: 'My Trips', path: '/trips', icon: Map },
        ];
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return [
          ...common,
          { name: 'User Mgmt', path: '/users', icon: Users },
          { name: 'All Loads', path: '/loads', icon: Truck },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      default:
        return common;
    }
  };

  const navItems = getNavItems(user?.role);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
             <Truck className="h-8 w-8 text-brand-600 mr-2" />
             <span className="text-xl font-bold text-gray-900 dark:text-white">RoadHive</span>
          </div>
          {/* Desktop Theme Toggle in Sidebar Header */}
          <button 
            onClick={toggleTheme} 
            className="hidden md:block p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
                `}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-200 font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate w-32">{user?.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{user?.companyName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{user?.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">RoadHive</span>
          <button 
            onClick={toggleTheme} 
            className="p-2 text-gray-500 dark:text-gray-400"
          >
             {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};