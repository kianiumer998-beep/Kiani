
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, Role } from './types';
import { api } from './services/api';
import AuthPage from './components/Auth.tsx';
import DashboardPage from './components/Dashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import PlansPage from './components/Plans.tsx';
import CommissionsPage from './components/Commissions.tsx';
import TransactionsPage from './components/Transactions.tsx';
import ReferralsPage from './components/Referrals.tsx';
import ProfilePage from './components/Profile.tsx';
import { Spinner } from './components/ui';
import { DashboardIcon, UsersIcon, LogoutIcon, CommissionIcon, PlanIcon, TransactionIcon, ReferralIcon, ProfileIcon, SettingsIcon, WalletIcon } from './components/Icons';

// Auth Context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This would be replaced with a real check for a stored token
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === Role.ADMIN,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Protected Route
const ProtectedRoute = ({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

// Layout Component
const NavItem = ({ to, icon, label }: { to: string; icon: ReactNode; label: ReactNode }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
    return (
        <Link to={to} className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary text-white' : 'text-gray-200 hover:bg-primary-dark hover:text-white'}`}>
            {icon}
            <span className="ml-3">{label}</span>
        </Link>
    );
};

const Layout = ({ children }: { children: ReactNode }) => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const userLinks: { to: string; icon: ReactNode; label: string }[] = [
      { to: '/dashboard', icon: <DashboardIcon className="h-5 w-5" />, label: 'Dashboard' },
      { to: '/dashboard/plans', icon: <PlanIcon className="h-5 w-5" />, label: 'Buy Plans' },
      { to: '/dashboard/commissions', icon: <CommissionIcon className="h-5 w-5" />, label: 'Commissions' },
      { to: '/dashboard/transactions', icon: <TransactionIcon className="h-5 w-5" />, label: 'Transactions' },
      { to: '/dashboard/referrals', icon: <ReferralIcon className="h-5 w-5" />, label: 'Referrals' },
      { to: '/dashboard/profile', icon: <ProfileIcon className="h-5 w-5" />, label: 'Profile' },
    ];

    if (user?.role === Role.ADMIN) {
        userLinks.push({ to: '/admin', icon: <SettingsIcon className="h-5 w-5" />, label: 'Admin Panel' });
    }

    const SidebarContent = () => (
      <div className="flex flex-col h-full bg-neutral-dark text-white">
          <div className="flex items-center justify-center h-20 border-b border-gray-700">
              <WalletIcon className="h-8 w-8 text-secondary"/>
              <span className="ml-2 text-2xl font-bold">SmartEarning</span>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {userLinks.map(link => <NavItem key={link.to} to={link.to} icon={link.icon} label={link.label} />)}
          </nav>
          <div className="px-4 py-4 border-t border-gray-700">
              <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-200 rounded-lg hover:bg-primary-dark hover:text-white">
                  <LogoutIcon className="h-5 w-5" />
                  <span className="ml-3">Logout</span>
              </button>
          </div>
      </div>
    );
    
    return (
        <div className="flex h-screen bg-neutral-light">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <SidebarContent />
                </div>
            </aside>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
                <div onClick={() => setSidebarOpen(false)} className={`absolute inset-0 bg-black opacity-50 transition-opacity ${sidebarOpen ? 'ease-out duration-300 opacity-50' : 'ease-in duration-200 opacity-0'}`} />
                <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-neutral-dark transform transition-transform ${sidebarOpen ? 'ease-in-out duration-300 translate-x-0' : 'ease-in-out duration-300 -translate-x-full'}`}>
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            type="button"
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Close sidebar</span>
                            <svg className="h-6 w-6 text-white" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <SidebarContent />
                </div>
            </div>
            
            <div className="flex flex-col flex-1 w-0 overflow-hidden">
                <header className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
                    <button onClick={() => setSidebarOpen(true)} className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden">
                        <span className="sr-only">Open sidebar</span>
                        <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="flex-1 px-4 flex justify-between">
                        <div className="flex-1 flex">
                            {/* Search bar can go here */}
                        </div>
                        <div className="ml-4 flex items-center md:ml-6">
                            <span className="text-gray-700">Welcome, {user?.fullName}</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route index element={<DashboardPage />} />
                  <Route path="plans" element={<PlansPage />} />
                  <Route path="commissions" element={<CommissionsPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="referrals" element={<ReferralsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <ProtectedRoute adminOnly={true}>
              <Layout>
                 <Routes>
                    <Route index element={<AdminPanel />} />
                 </Routes>
              </Layout>
            </ProtectedRoute>
          } />

        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
