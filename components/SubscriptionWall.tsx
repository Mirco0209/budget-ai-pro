import React, { useState } from 'react';
import { Lock, CreditCard, LogOut, CheckCircle, X, User as UserIcon, Calendar, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { storageService } from '../services/storageService';

interface SubscriptionWallProps {
  onLogout?: () => void;
  onPaymentSuccess: () => void;
  onClose?: () => void;
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    holder: '',
    number: '',
    expiry: '',
    cvv: ''
  });
  const [error, setError] = useState('');

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (paymentMethod === 'card') {
       if (!cardData.holder || !cardData.number || !cardData.expiry || !cardData.cvv) {
           setError(t('fillAllFields'));
           return;
       }
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
        setIsProcessing(false);
        onPaymentSuccess();
    }, 2000);
  };

  const handleDeleteAccount = () => {
    if (confirm(t('deleteWarning'))) {
       storageService.auth.deleteAccount();
       if (onLogout) onLogout();
       else window.location.reload(); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-800 bg-slate-950/50">
           <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 animate-pulse">
              <Lock size={32} className="text-white" />
           </div>
           <h2 className="text-2xl font-bold text-white mb-2">{title || t('trialExpiredTitle')}</h2>
           <p className="text-slate-400 text-sm max-w-sm mx-auto">
             {description || t('trialExpiredDesc')}
           </p>
           {onClose && (
               <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                   <X size={24} />
               </button>
           )}
        </div>

        {/* Payment Form */}
        <div className="p-6 overflow-y-auto flex-1">
           {error && (
             <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center">
                <AlertCircle size={16} className="mr-2 shrink-0" />
                {error}
             </div>
           )}

           <div className="flex space-x-2 mb-6 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${paymentMethod === 'card' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                 <CreditCard size={16} />
                 <span>Card</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('paypal')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 ${paymentMethod === 'paypal' ? 'bg-[#003087] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                 <span className="font-bold italic">PayPal</span>
              </button>
           </div>

           <form onSubmit={handlePayment} className="space-y-4">
               {paymentMethod === 'card' ? (
                   <>
                       <div>
                           <label className="block text-xs text-slate-400 mb-1">{t('cardHolder')}</label>
                           <div className="relative">
                               <UserIcon className="absolute left-3 top-3 text-slate-500" size={16} />
                               <input 
                                   type="text" 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-primary outline-none"
                                   placeholder="John Doe"
                                   value={cardData.holder}
                                   onChange={e => setCardData({...cardData, holder: e.target.value})}
                               />
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs text-slate-400 mb-1">{t('cardNumber')}</label>
                           <div className="relative">
                               <CreditCard className="absolute left-3 top-3 text-slate-500" size={16} />
                               <input 
                                   type="text" 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-primary outline-none"
                                   placeholder="0000 0000 0000 0000"
                                   value={cardData.number}
                                   onChange={e => setCardData({...cardData, number: e.target.value})}
                               />
                           </div>
                       </div>
                       <div className="flex space-x-3">
                           <div className="flex-1">
                               <label className="block text-xs text-slate-400 mb-1">{t('expiryDate')}</label>
                               <div className="relative">
                                   <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                   <input 
                                       type="text" 
                                       className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-primary outline-none"
                                       placeholder="MM/YY"
                                       value={cardData.expiry}
                                       onChange={e => setCardData({...cardData, expiry: e.target.value})}
                                   />
                               </div>
                           </div>
                           <div className="flex-1">
                               <label className="block text-xs text-slate-400 mb-1">{t('cvv')}</label>
                               <div className="relative">
                                   <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                                   <input 
                                       type="text" 
                                       className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-primary outline-none"
                                       placeholder="123"
                                       value={cardData.cvv}
                                       onChange={e => setCardData({...cardData, cvv: e.target.value})}
                                   />
                               </div>
                           </div>
                       </div>
                   </>
               ) : (
                   <div className="text-center py-8">
                       <p className="text-slate-300 text-sm mb-4">You will be redirected to PayPal to complete your secure payment.</p>
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto opacity-80">
                           <span className="text-[#003087] font-bold text-2xl italic">P</span>
                       </div>
                   </div>
               )}

               <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center mt-6"
               >
                  {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        {t('processing')}
                      </>
                  ) : (
                      <>
                         <CheckCircle size={18} className="mr-2" />
                         {paymentMethod === 'card' ? t('payWithCard') : t('payWithPaypal')}
                      </>
                  )}
               </button>
           </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
           <button 
             onClick={handleDeleteAccount}
             className="text-red-400 hover:text-red-300 flex items-center space-x-1"
           >
              <LogOut size={12} />
              <span>{t('deleteAccount')}</span>
           </button>
           
           {onLogout && (
               <button 
                 onClick={onLogout}
                 className="text-slate-500 hover:text-slate-300"
               >
                 {t('signOut')}
               </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWall;