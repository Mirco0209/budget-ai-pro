import React from 'react';
import { Lock, CreditCard, Wallet, AlertCircle, LogOut, CheckCircle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { storageService } from '../services/storageService';

interface SubscriptionWallProps {
  onLogout?: () => void;
  onPaymentSuccess: () => void;
  onClose?: () => void; // Optional: If provided, allows closing the modal (for upgrades)
  title?: string;
  description?: string;
}

const SubscriptionWall: React.FC<SubscriptionWallProps> = ({ 
  onLogout, 
  onPaymentSuccess, 
  onClose,
  title,
  description 
}) => {
  const { t } = useLanguage();

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      storageService.auth.deleteAccount();
      if (onLogout) onLogout();
    }
  };

  const handleSimulatePayment = () => {
    // In a real app, this would be a webhook listener or API call
    if (window.confirm('Simulate successful payment verification?')) {
        storageService.activateSubscription();
        onPaymentSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button (Only if onClose provided) */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white z-10 p-1 bg-slate-800/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Left Side: Alert */}
        <div className="bg-gradient-to-br from-red-900/50 to-slate-900 p-8 md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
           <div>
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center mb-4">
                <Lock size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{title || t('trialExpiredTitle')}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {description || t('trialExpiredDesc')}
              </p>
           </div>
           
           {onLogout && (
             <div className="mt-8">
                <button 
                  onClick={handleDeleteAccount}
                  className="flex items-center text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={14} className="mr-2" />
                  {t('deleteAccount')}
                </button>
                <p className="text-[10px] text-slate-600 mt-1">{t('deleteWarning')}</p>
             </div>
           )}
        </div>

        {/* Right Side: Payment Info */}
        <div className="p-8 md:w-2/3">
           <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
             <CreditCard size={20} className="mr-2 text-primary" />
             {t('paymentMethod')}
           </h3>

           <div className="space-y-6">
              {/* Bank Transfer Option */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                 <div className="flex items-center mb-3">
                    <Wallet size={18} className="text-slate-400 mr-2" />
                    <span className="font-medium text-white">{t('bankTransfer')}</span>
                 </div>
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                       <span className="text-slate-500">{t('beneficiary')}</span>
                       <span className="text-slate-300 font-mono">YOUR NAME HERE</span> {/* INSERT YOUR NAME */}
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                       <span className="text-slate-500">{t('iban')}</span>
                       <span className="text-slate-300 font-mono select-all">IT00 X000 0000 0000 0000</span> {/* INSERT IBAN */}
                    </div>
                 </div>
              </div>

              {/* PayPal Option */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="font-bold text-blue-400 italic mr-2">PayPal</span>
                        <span className="text-sm text-slate-300">user@example.com</span> {/* INSERT PAYPAL EMAIL */}
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-slate-800">
              <button 
                onClick={handleSimulatePayment}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-green-900/20"
              >
                <CheckCircle size={18} className="mr-2" />
                {t('confirmPayment')}
              </button>
              <p className="text-center text-xs text-slate-500 mt-3">
                 {t('contactSupport')}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWall;