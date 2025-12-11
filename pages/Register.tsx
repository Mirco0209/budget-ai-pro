import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import LegalModal from '../components/LegalModal';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      setTimeout(() => {
        try {
          storageService.auth.register({ name, email, password });
          // Auto login after register
          storageService.auth.login(email, password);
          onRegister();
        } catch (err: any) {
          setError(err.message || 'Registration failed');
          setIsLoading(false);
        }
      }, 500);
    } catch (err) {
      setError('An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{t('createAccount')}</h1>
          <p className="text-slate-400">{t('startJourney')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center text-red-400 text-sm mb-6">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">{t('fullName')}</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-600"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-600"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-600"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center px-4">
             {t('agreeTo')}{' '}
             <button type="button" onClick={() => setShowLegal('terms')} className="text-primary hover:underline">{t('termsOfService')}</button>
             {' '}{t('and')}{' '}
             <button type="button" onClick={() => setShowLegal('privacy')} className="text-primary hover:underline">{t('privacyPolicy')}</button>.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center group disabled:opacity-70"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                {t('createAccount')} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            {t('alreadyHaveAccount')}{' '}
            <button onClick={onSwitchToLogin} className="text-primary hover:text-orange-400 font-medium transition-colors">
              {t('signIn')}
            </button>
          </p>
        </div>
      </div>

      {showLegal && (
          <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}
    </div>
  );
};

export default Register;