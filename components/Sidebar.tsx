import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Wallet, BrainCircuit, Settings, LogOut, TrendingUp, User as UserIcon, Globe, Clock, Shield } from 'lucide-react';
import { storageService } from '../services/storageService';
import { User, UserSettings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [trialDays, setTrialDays] = useState<number>(0);
  const [isTrial, setIsTrial] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const currentUser = storageService.auth.getCurrentUser();
    setUser(currentUser);
    const settings = storageService.getSettings();
    
    if (settings.subscriptionStatus === 'trial') {
        setIsTrial(true);
        setTrialDays(storageService.getTrialDaysLeft());
    }
  }, []);

  // Admin Check
  const isAdmin = user?.email === 'admin@budgetai.com';

  let navItems;

  if (isAdmin) {
    // Admin sees ONLY Admin Panel
    navItems = [
      { id: 'admin', label: t('admin'), icon: Shield }
    ];
  } else {
    // Standard Users see standard menu
    navItems = [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'transactions', label: t('transactions'), icon: Wallet },
      { id: 'advisor', label: t('advisor'), icon: BrainCircuit },
      { id: 'plans', label: t('plans'), icon: Settings },
    ];
  }

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 hidden md:flex">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800/50">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0 ${isAdmin ? 'bg-red-600 shadow-red-500/20' : 'bg-gradient-to-br from-primary to-accent shadow-primary/20'}`}>
          {isAdmin ? <Shield size={20} /> : 'B'}
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-lg tracking-tight text-white truncate">
            {isAdmin ? 'Admin Console' : 'Budget AI'}
          </h1>
          <div className="flex items-center text-xs text-slate-400">
             <UserIcon size={10} className="mr-1" />
             <span className="truncate">{user?.name || 'Guest'}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-primary border-l-4 border-primary'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-primary' : 'text-slate-500 group-hover:text-white'} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-4 border-t border-slate-800">
        {/* Trial Countdown - Hide for Admin */}
        {isTrial && !isAdmin && (
           <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center space-x-3">
              <Clock size={16} className="text-primary" />
              <div>
                 <p className="text-white font-bold text-sm">{trialDays}</p>
                 <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t('daysLeft')}</p>
              </div>
           </div>
        )}

        {/* Language Selector */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
           <button 
             onClick={() => setLanguage('en')}
             className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-colors ${language === 'en' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
           >
             🇺🇸 EN
           </button>
           <button 
             onClick={() => setLanguage('it')}
             className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-colors ${language === 'it' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
           >
             🇮🇹 IT
           </button>
        </div>

        {/* Health Score - Hide for Admin */}
        {!isAdmin && (
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-sm text-slate-300 mb-2">
              <TrendingUp size={16} className="text-green-500" />
              <span>{t('financialHealth')}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full w-[75%]"></div>
            </div>
            <p className="text-xs text-right mt-1 text-slate-500">{t('good')} (75/100)</p>
          </div>
        )}
        
        <button 
          onClick={onLogout}
          className="flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-300 transition-colors w-full group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;