import React, { useState, useEffect, useRef } from 'react';
import { Check, Zap, Camera, Activity, X, User as UserIcon, Globe, DollarSign, Download, Save, CreditCard, Upload } from 'lucide-react';
import { PLANS, UserSettings, User, Language } from '../types';
import { storageService } from '../services/storageService';
import SubscriptionWall from '../components/SubscriptionWall';
import { useLanguage } from '../contexts/LanguageContext';

const Plans: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(storageService.getSettings());
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = storageService.auth.getCurrentUser();
    setUser(u);
    if (u) setUsername(u.name);
    setSettings(storageService.getSettings());
  }, []);

  const handleSelectPlan = (key: string) => {
    setPendingPlan(key);
  };

  const handlePaymentSuccess = () => {
    if (pendingPlan) {
      const updated = storageService.updateSettings({ 
        plan: pendingPlan as any,
        subscriptionStatus: 'active'
      });
      setSettings(updated);
      setPendingPlan(null);
    }
  };

  const handleSaveProfile = () => {
    if (username.trim()) {
        storageService.auth.updateCurrentUser({ name: username });
        storageService.updateSettings({ username: username });
        alert(t('saveChanges') + ' OK!');
    }
  };

  const handleExportData = () => {
    const transactions = storageService.getTransactions();
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (Array.isArray(json)) {
                storageService.importTransactions(json);
                alert(t('importSuccess'));
            } else {
                throw new Error("Invalid format");
            }
        } catch (err) {
            alert(t('importError'));
        }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Helper to check features based on plan key
  const hasScanner = (key: string) => ['medium', 'advanced', 'ultra'].includes(key);
  const hasForecast = (key: string) => ['advanced', 'ultra'].includes(key);

  return (
    <div className="space-y-8 pb-10">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">{t('settingsTitle')}</h2>
        <p className="text-slate-400">{t('settingsDesc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6">
            
            {/* Profile Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-slate-800 rounded-lg text-primary">
                        <UserIcon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('profile')}</h3>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('email')}</label>
                        <input 
                            type="text" 
                            value={user?.email || ''} 
                            disabled 
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-3 px-4 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('fullName')}</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:border-primary outline-none"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button 
                            onClick={handleSaveProfile}
                            className="flex items-center space-x-2 bg-white text-slate-950 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                        >
                            <Save size={16} />
                            <span>{t('saveChanges')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                        <Globe size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('preferences')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <DollarSign size={12} /> {t('currency')}
                        </label>
                        <select 
                            value={settings.currency}
                            onChange={(e) => setSettings(storageService.updateSettings({ currency: e.target.value }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:border-primary outline-none"
                        >
                            <option value="€">EUR (€)</option>
                            <option value="$">USD ($)</option>
                            <option value="£">GBP (£)</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <Globe size={12} /> {t('language')}
                        </label>
                         <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 px-4 text-white focus:border-primary outline-none"
                        >
                            <option value="en">English 🇺🇸</option>
                            <option value="it">Italiano 🇮🇹</option>
                            <option value="es">Español 🇪🇸</option>
                            <option value="fr">Français 🇫🇷</option>
                            <option value="de">Deutsch 🇩🇪</option>
                        </select>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                     <div>
                        <h4 className="text-white font-medium text-sm">{t('aiFeatures')}</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{t('aiDesc')}</p>
                     </div>
                     <button 
                       onClick={() => setSettings(storageService.updateSettings({ aiEnabled: !settings.aiEnabled }))}
                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.aiEnabled ? 'bg-primary' : 'bg-slate-700'}`}
                     >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                </div>
            </div>

            {/* Data Management */}
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-slate-800 rounded-lg text-green-400">
                        <Download size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t('dataManagement')}</h3>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-medium text-sm">{t('exportData')}</h4>
                            <p className="text-xs text-slate-400 mt-1">{t('exportDesc')}</p>
                        </div>
                        <button 
                            onClick={handleExportData}
                            className="flex items-center space-x-2 bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                        >
                            <Download size={14} />
                            <span>{t('downloadJson')}</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                        <div>
                            <h4 className="text-white font-medium text-sm">{t('importData')}</h4>
                            <p className="text-xs text-slate-400 mt-1">{t('importDesc')}</p>
                        </div>
                        <div>
                             <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="application/json"
                                onChange={handleFileImport}
                             />
                             <button 
                                onClick={handleImportClick}
                                className="flex items-center space-x-2 bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                            >
                                <Upload size={14} />
                                <span>{t('uploadJson')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* Right Column: Plans */}
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-2">
                 <div className="p-2 bg-slate-800 rounded-lg text-purple-400">
                     <CreditCard size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-white">{t('selectPlan')}</h3>
            </div>
            
            <div className="space-y-4">
            {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrent = settings.plan === key;
            const isUltra = key === 'ultra';

            return (
                <div 
                key={key} 
                className={`relative rounded-xl p-5 border transition-all duration-300 ${
                    isCurrent 
                    ? 'bg-slate-900 border-primary shadow-lg shadow-primary/10' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
                >
                {isUltra && !isCurrent && (
                    <div className="absolute top-4 right-4 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded-md">
                    {t('recommended')}
                    </div>
                )}
                {isCurrent && (
                    <div className="absolute top-4 right-4 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded-md">
                    {t('currentPlan')}
                    </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                        <div className="flex items-baseline mt-1">
                            <span className="text-2xl font-bold text-white">{plan.price}</span>
                            <span className="text-xs text-slate-500 ml-1">/mo</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center text-xs text-slate-300">
                        <Check size={12} className="mr-2 text-primary" />
                        {t('unlimitedTx')}
                    </div>
                    <div className="flex items-center text-xs text-slate-300">
                        <Zap size={12} className={`mr-2 ${plan.aiLimit > 0 ? 'text-yellow-400' : 'text-slate-600'}`} />
                        {plan.aiLimit === 0 ? t('noAi') : plan.aiLimit > 1000 ? t('unltdAi') : `${plan.aiLimit} ${t('aiChats')}`}
                    </div>
                    <div className={`flex items-center text-xs ${hasScanner(key) || key === 'base' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {(hasScanner(key) || key === 'base') ? <Camera size={12} className="mr-2 text-blue-400" /> : <X size={12} className="mr-2" />}
                        {t('scanner')}
                    </div>
                    <div className={`flex items-center text-xs ${hasForecast(key) ? 'text-slate-300' : 'text-slate-600'}`}>
                        {hasForecast(key) ? <Activity size={12} className="mr-2 text-purple-400" /> : <X size={12} className="mr-2" />}
                        {t('forecast')}
                    </div>
                </div>

                {!isCurrent && (
                    <button
                        onClick={() => handleSelectPlan(key)}
                        className="w-full py-2 rounded-lg font-semibold text-sm bg-white text-slate-950 hover:bg-slate-200 transition-colors"
                    >
                        {t('selectPlan')}
                    </button>
                )}
                </div>
            );
            })}
            </div>
        </div>
      </div>

      {/* Payment Modal Overlay */}
      {pendingPlan && (
        <SubscriptionWall 
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setPendingPlan(null)}
          title={t('upgradeTitle')}
          description={t('upgradeDesc')}
        />
      )}
    </div>
  );
};

export default Plans;