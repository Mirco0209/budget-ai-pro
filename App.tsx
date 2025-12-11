import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Advisor from './pages/Advisor';
import Plans from './pages/Plans';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import Admin from './pages/Admin';
import SubscriptionWall from './components/SubscriptionWall';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [showLanding, setShowLanding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Subscription State
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for existing session
    const user = storageService.auth.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setShowLanding(false); // If logged in, skip landing
      if (user.email === 'admin@budgetai.com') {
          setIsAdmin(true);
          setActivePage('admin'); // Admin goes straight to admin panel
          setIsSubscriptionExpired(false);
      } else {
          checkSubscription();
      }
    }
    setIsLoading(false);
  }, []);

  const checkSubscription = () => {
     const settings = storageService.getSettings();
     setIsSubscriptionExpired(settings.subscriptionStatus === 'expired');
  };

  const handleLogin = () => {
    const user = storageService.auth.getCurrentUser();
    setIsAuthenticated(true);
    setShowLanding(false);
    
    if (user?.email === 'admin@budgetai.com') {
        setIsAdmin(true);
        setActivePage('admin'); // Admin goes straight to admin panel
        setIsSubscriptionExpired(false);
    } else {
        setActivePage('dashboard');
        checkSubscription();
    }
  };

  const handleLogout = () => {
    storageService.auth.logout();
    setIsAuthenticated(false);
    setIsSubscriptionExpired(false);
    setIsAdmin(false);
    setAuthView('login');
    setShowLanding(true); // Return to landing on logout
    setActivePage('dashboard');
  };

  const handleLandingStart = () => {
      setShowLanding(false);
      setAuthView('register');
  };

  const handleLandingLogin = () => {
      setShowLanding(false);
      setAuthView('login');
  };

  const renderContent = () => {
    if (isAdmin) {
       // Only allow Admin page for admin user
       return <Admin />;
    }

    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'advisor': return <Advisor />;
      case 'plans': return <Plans />;
      default: return <Dashboard />;
    }
  };

  const getTitle = () => {
    if (isAdmin) return 'Admin Console';
    return activePage.charAt(0).toUpperCase() + activePage.slice(1);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Landing Page
  if (!isAuthenticated && showLanding) {
      return <LandingPage onStart={handleLandingStart} onLogin={handleLandingLogin} />;
  }

  // 2. Auth Screens
  if (!isAuthenticated && !showLanding) {
    return authView === 'login' ? (
      <Login 
        onLogin={handleLogin} 
        onSwitchToRegister={() => setAuthView('register')} 
      />
    ) : (
      <Register 
        onRegister={handleLogin} 
        onSwitchToLogin={() => setAuthView('login')} 
      />
    );
  }

  // 3. Subscription Wall (Blocks access if expired), but skip for Admin
  if (isSubscriptionExpired && !isAdmin) {
     return (
       <SubscriptionWall 
         onLogout={handleLogout} 
         onPaymentSuccess={() => setIsSubscriptionExpired(false)} 
       />
     );
  }

  // 4. Main App
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-primary/30">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={handleLogout} 
      />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <div 
          className={`w-64 bg-slate-950 h-full transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
           <Sidebar 
             activePage={activePage} 
             setActivePage={(page) => { setActivePage(page); setIsSidebarOpen(false); }} 
             onLogout={handleLogout}
           />
        </div>
      </div>
      
      <div className="md:pl-64 flex flex-col min-h-screen">
        <MobileHeader toggleSidebar={() => setIsSidebarOpen(true)} title={getTitle()} />
        
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;