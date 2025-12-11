import React from 'react';
import { ArrowRight, BrainCircuit, Camera, TrendingUp, Shield, BarChart3, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LegalModal from '../components/LegalModal';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const { t, language, setLanguage } = useLanguage();
  const [showLegal, setShowLegal] = React.useState<'privacy' | 'terms' | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary/30 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
                B
              </div>
              <span className="font-bold text-xl tracking-tight">Budget AI Pro</span>
            </div>
            
            <div className="flex items-center space-x-4">
               <div className="hidden md:flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${language === 'en' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        EN
                    </button>
                    <button 
                        onClick={() => setLanguage('it')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${language === 'it' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        IT
                    </button>
                </div>
              <button 
                onClick={onLogin}
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                {t('landingCtaLogin')}
              </button>
              <button 
                onClick={onStart}
                className="bg-white text-slate-950 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                {t('landingCtaStart')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-slate-700 bg-slate-900/50 backdrop-blur-sm">
             <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2"></span>
             <span className="text-xs font-medium text-slate-300">v1.0 Now Available</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
             {language === 'en' ? 'Master your money with ' : 'Domina le tue finanze con '}
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
               Artificial Intelligence
             </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {t('landingHeroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
             <button 
               onClick={onStart}
               className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-xl shadow-orange-900/20 flex items-center justify-center gap-2 transform hover:scale-105 transition-all"
             >
                {t('landingCtaStart')}
                <ArrowRight size={20} />
             </button>
             <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all"
             >
                {t('demoAccess')}
             </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-900 py-20 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-primary/50 transition-colors group">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <BrainCircuit size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{t('featureAiTitle')}</h3>
                  <p className="text-slate-400 leading-relaxed">{t('featureAiDesc')}</p>
               </div>

               <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors group">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Camera size={32} className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{t('featureScanTitle')}</h3>
                  <p className="text-slate-400 leading-relaxed">{t('featureScanDesc')}</p>
               </div>

               <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-green-500/50 transition-colors group">
                  <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <TrendingUp size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{t('featureForecastTitle')}</h3>
                  <p className="text-slate-400 leading-relaxed">{t('featureForecastDesc')}</p>
               </div>
            </div>
         </div>
      </section>

      {/* Trust / Stats Section */}
      <section className="py-20 border-t border-slate-800 relative">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
             <div className="md:w-1/2 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                   Why choose <span className="text-primary">Budget AI?</span>
                </h2>
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <CheckCircle className="text-primary mt-1 shrink-0" />
                      <div>
                         <h4 className="font-semibold text-white">Privacy First</h4>
                         <p className="text-slate-400 text-sm">Your data is encrypted. We don't sell your financial info.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <CheckCircle className="text-primary mt-1 shrink-0" />
                      <div>
                         <h4 className="font-semibold text-white">Real-time Sync</h4>
                         <p className="text-slate-400 text-sm">Access your budget from any device, anywhere.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <CheckCircle className="text-primary mt-1 shrink-0" />
                      <div>
                         <h4 className="font-semibold text-white">Export Anytime</h4>
                         <p className="text-slate-400 text-sm">Your data is yours. Export to JSON/CSV instantly.</p>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Visual representation */}
             <div className="md:w-1/2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-3xl opacity-20 rounded-full"></div>
                <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                           <Shield className="text-green-400" size={20} />
                           <span className="font-bold">Financial Health</span>
                        </div>
                        <span className="text-green-400 font-mono font-bold">92/100</span>
                    </div>
                    <div className="space-y-3">
                       <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-primary to-accent"></div>
                       </div>
                       <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-1/2">
                          <div className="h-full w-1/2 bg-slate-600"></div>
                       </div>
                    </div>
                    <div className="mt-6 flex justify-between items-end">
                       <div>
                          <p className="text-xs text-slate-500">Predicted Balance</p>
                          <p className="text-2xl font-bold text-white">€4,250.00</p>
                       </div>
                       <BarChart3 className="text-slate-600" size={40} />
                    </div>
                </div>
             </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
         <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">B</div>
               <span className="font-bold text-white">Budget AI Pro</span>
            </div>
            
            <div className="flex gap-6 text-sm text-slate-400">
               <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">{t('termsOfService')}</button>
               <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">{t('privacyPolicy')}</button>
            </div>

            <p className="text-xs text-slate-600">
               © {new Date().getFullYear()} {t('landingFooterRights')}
            </p>
         </div>
      </footer>

      {showLegal && (
          <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}
    </div>
  );
};

export default LandingPage;