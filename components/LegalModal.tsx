import React from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {type === 'privacy' ? <Shield className="text-primary" /> : <FileText className="text-primary" />}
                {type === 'privacy' ? t('privacyPolicy') : t('termsOfService')}
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto text-slate-300 space-y-4 text-sm leading-relaxed">
            {type === 'privacy' ? (
                <>
                    <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p>At Budget AI Pro, we prioritize your privacy. This policy explains how we handle your data.</p>
                    <h4 className="text-white font-semibold mt-4">1. Data Collection</h4>
                    <p>We collect your email, name, and transaction data entered into the application. If you use the receipt scanner, the image is processed by Google Gemini AI.</p>
                    <h4 className="text-white font-semibold mt-4">2. AI Processing</h4>
                    <p>Your data is sent to Google Gemini APIs to provide financial advice and receipt scanning features. We do not use your data to train public AI models.</p>
                    <h4 className="text-white font-semibold mt-4">3. Data Security</h4>
                    <p>Your data is stored locally on your device (in the current Demo version) or securely on our encrypted servers (in the Production version).</p>
                </>
            ) : (
                 <>
                    <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                    <p>By using Budget AI Pro, you agree to these terms.</p>
                    <h4 className="text-white font-semibold mt-4">1. Usage License</h4>
                    <p>We grant you a limited, non-exclusive license to use the application for personal financial tracking.</p>
                    <h4 className="text-white font-semibold mt-4">2. Financial Disclaimer</h4>
                    <p className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-yellow-200">
                        {t('legalDisclaimer')}
                    </p>
                    <h4 className="text-white font-semibold mt-4">3. Subscriptions</h4>
                    <p>Premium features require a paid subscription. Refunds are handled according to EU consumer laws.</p>
                </>
            )}
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;