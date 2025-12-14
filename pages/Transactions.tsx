import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Calendar, Tag, FileText, ArrowDownLeft, ArrowUpRight, Camera, Loader, Sparkles, Lock, Mic, X, AlertCircle, Square } from 'lucide-react';
import { storageService } from '../services/storageService';
import { analyzeReceipt, parseNaturalLanguageTransaction } from '../services/geminiService';
import { Transaction, TransactionType, CATEGORIES, OTHER_SUB_CATEGORIES } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Local state to manage the 2-step category selection
  const [mainCategory, setMainCategory] = useState<string>('Other');
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'expense',
    category: 'Other',
    note: ''
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false); 
  const [canUseScanner, setCanUseScanner] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  
  const { t, language } = useLanguage();

  useEffect(() => {
    setTransactions(storageService.getTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Allow users to try scan/voice on ALL plans now (updated logic for Base plan inclusion)
    const settings = storageService.getSettings();
    const allowedPlans = ['base', 'medium', 'advanced', 'ultra'];
    setCanUseScanner(allowedPlans.includes(settings.plan));

    return () => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch(e) {}
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Update mainCategory state when formData changes
  useEffect(() => {
    if (formData.category) {
        if (CATEGORIES.includes(formData.category)) {
            setMainCategory(formData.category);
        } else {
            setMainCategory('Other');
        }
    }
  }, [formData.category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.date) return;

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: formData.date,
      amount: Number(formData.amount),
      type: formData.type as TransactionType,
      category: formData.category || 'Other',
      note: formData.note || ''
    };

    const updated = storageService.addTransaction(newTx);
    setTransactions(updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsFormOpen(false);
    
    setFormData({ ...formData, amount: 0, note: '', category: 'Other' });
    setMainCategory('Other');
  };

  const handleDelete = (id: string) => {
    const updated = storageService.deleteTransaction(id);
    setTransactions(updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleScanClick = () => {
    if (!canUseScanner) {
        alert(t('upgradeScan'));
        return;
    }
    fileInputRef.current?.click();
  };

  const handleVoiceStart = () => {
    setSpeechError(null);

    // Check support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert(t('micError'));
        return;
    }
    
    // If already listening, stop it manually
    if (isListening) {
        stopListening();
        return;
    }

    try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Configuration
        recognition.lang = language === 'it' ? 'it-IT' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false; 

        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            setIsFormOpen(true);
            // Safety timeout: if no result in 15 seconds, stop
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                 if (isListening) {
                    stopListening();
                    setSpeechError("Timeout: No speech detected.");
                 }
            }, 15000);
        };

        recognition.onresult = async (event: any) => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            const text = event.results[0][0].transcript;
            
            setIsListening(false);
            setIsScanning(true); // Reuse scanning loader for AI processing UI
            
            try {
                const data = await parseNaturalLanguageTransaction(text);
                setFormData(prev => ({
                    ...prev,
                    amount: data.amount || 0,
                    type: data.type || 'expense',
                    date: data.date || new Date().toISOString().split('T')[0],
                    category: data.category || 'Other',
                    note: data.note || text
                }));
            } catch (err) {
                console.error(err);
                setSpeechError("AI parsing failed. Please try again.");
            } finally {
                setIsScanning(false);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            setIsListening(false);
            
            if (event.error === 'not-allowed') {
                setSpeechError("Microphone access denied.");
            } else if (event.error === 'no-speech') {
                // Ignore no-speech if explicitly stopped
            } else if (event.error === 'aborted') {
                // Ignore aborted
            } else {
                setSpeechError(`Error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            setIsListening(false);
        };

        recognition.start();

    } catch (e) {
        console.error("Mic initialization failed", e);
        setSpeechError("Microphone initialization error.");
    }
  };

  const stopListening = () => {
      // Manually stop. This triggers onresult if there are partial results, or onend.
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
          setIsListening(false);
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setIsFormOpen(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
            const data = await analyzeReceipt(base64);
            setFormData(prev => ({
                ...prev,
                amount: data.totalAmount || 0,
                date: data.date || new Date().toISOString().split('T')[0],
                category: data.category || 'Other',
                note: data.merchant ? `Receipt: ${data.merchant}` : 'Scanned Receipt',
                type: 'expense'
            }));
        } catch (err) {
            alert("Could not analyze receipt. Please try again.");
        } finally {
            setIsScanning(false);
        }
    };
    } catch (error) {
        setIsScanning(false);
    }
  };

  const handleMainCategoryChange = (val: string) => {
      setMainCategory(val);
      if (val !== 'Other') {
          setFormData({ ...formData, category: val });
      } else {
          setFormData({ ...formData, category: OTHER_SUB_CATEGORIES[0] });
      }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'income': return 'text-green-400 bg-green-400/10';
      case 'expense': return 'text-red-400 bg-red-400/10';
      case 'refund': return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'income': return <ArrowDownLeft size={16} />;
      case 'expense': return <ArrowUpRight size={16} />;
      case 'refund': return <ArrowDownLeft size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('transactions')}</h2>
          <p className="text-slate-400">{t('manageMovements')}</p>
        </div>
        <div className="flex space-x-2">
            {/* Voice Input Button */}
            <button
                onClick={handleVoiceStart}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all border ${
                   isListening 
                   ? 'bg-red-500/20 text-red-500 border-red-500/50 animate-pulse' 
                   : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
            >
                {isListening ? <X size={18} /> : <Mic size={18} />}
                <span className="hidden md:inline">
                   {isListening ? t('listening') : t('voiceInput')}
                </span>
            </button>

            <button 
                onClick={handleScanClick}
                disabled={isScanning || isListening}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all border ${
                    canUseScanner 
                    ? 'bg-slate-800 hover:bg-slate-700 text-purple-400 border-purple-500/30' 
                    : 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed'
                }`}
            >
                {isScanning ? (
                    <Loader size={18} className="animate-spin" />
                ) : !canUseScanner ? (
                    <Lock size={16} />
                ) : (
                    <Camera size={18} />
                )}
                <span className="hidden md:inline">
                    {isScanning ? t('scanning') : canUseScanner ? t('scanAi') : t('scanLocked')}
                </span>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleFileChange}
            />

            <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center space-x-2 bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium transition-all shadow-lg shadow-primary/20"
            >
            <Plus size={18} />
            <span className="hidden md:inline">{t('addNew')}</span>
            </button>
        </div>
      </div>

      {/* Add Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-fade-in mb-8 relative overflow-hidden">
           {/* Voice/AI Status Overlay */}
           {(isScanning || isListening) && (
               <div className="absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center text-center p-4">
                   <div className="relative mb-4">
                       {isListening ? (
                           <div className="relative">
                               <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                               <Mic size={48} className="text-red-500 relative z-10 animate-bounce" />
                           </div>
                       ) : (
                           <Sparkles size={48} className="text-purple-500 animate-pulse" />
                       )}
                   </div>
                   <h4 className="text-white text-lg font-bold mb-1">
                       {isListening ? t('listening') : t('processingAudio')}
                   </h4>
                   
                   {isListening && (
                       <>
                           <p className="text-sm text-slate-300 mb-6 italic max-w-xs">"{t('voiceCommandHint')}"</p>
                           {/* Stop Button */}
                           <button 
                             type="button" 
                             onClick={(e) => {
                                 e.stopPropagation(); // Prevent propagation
                                 stopListening();
                             }}
                             className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-full text-lg font-bold border border-red-500 hover:bg-red-500 transition-all shadow-lg shadow-red-900/40 z-50 cursor-pointer hover:scale-105 active:scale-95"
                           >
                             <Square size={20} fill="currentColor" />
                             <span>{t('stopListening')}</span>
                           </button>
                       </>
                   )}
               </div>
           )}

           {/* Error Overlay */}
           {speechError && (
               <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-center p-4">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <h4 className="text-white text-lg font-bold mb-2">Error</h4>
                    <p className="text-slate-300 mb-6">{speechError}</p>
                    <button 
                        type="button"
                        onClick={() => setSpeechError(null)}
                        className="bg-slate-800 text-white px-6 py-2 rounded-full border border-slate-700 hover:bg-slate-700"
                    >
                        Close
                    </button>
               </div>
           )}
           
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               {t('newEntry')}
               {formData.note?.includes('Receipt') && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{t('autofilled')}</span>}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('date')}</label>
                <div className="relative">
                   <Calendar size={16} className="absolute left-3 top-3 text-slate-500" />
                   <input 
                      type="date" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-primary text-white" 
                   />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('type')}</label>
                <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary text-white"
                >
                    <option value="expense">{t('expense')}</option>
                    <option value="income">{t('income')}</option>
                    <option value="refund">{t('refund')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('category')}</label>
                 <div className="relative">
                   <Tag size={16} className="absolute left-3 top-3 text-slate-500" />
                   <select 
                      value={mainCategory}
                      onChange={e => handleMainCategoryChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-primary text-white"
                   >
                      {CATEGORIES.map(c => <option key={c} value={c}>{t(c as any)}</option>)}
                   </select>
                </div>
              </div>
              
              {/* Conditional Sub-Category Menu */}
              {mainCategory === 'Other' && (
                <div className="animate-fade-in">
                    <label className="block text-xs text-slate-400 mb-1">{t('subCategory')}</label>
                    <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-950 border border-primary/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary text-white bg-slate-800/50"
                    >
                        {OTHER_SUB_CATEGORIES.map(c => <option key={c} value={c}>{t(c as any)}</option>)}
                    </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">{t('amount')} (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary text-white"
                  placeholder="0.00" 
                />
              </div>

              <div className={mainCategory === 'Other' ? "lg:col-span-5" : ""}>
                 <label className="block text-xs text-slate-400 mb-1">{t('note')}</label>
                 <div className="relative">
                    <FileText size={16} className="absolute left-3 top-3 text-slate-500" />
                    <input 
                      type="text" 
                      value={formData.note}
                      onChange={e => setFormData({...formData, note: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-primary text-white"
                      placeholder={t('detailsPlaceholder')} 
                    />
                 </div>
              </div>
           </div>
           <div className="mt-4 flex justify-end">
              <button type="submit" className="bg-white text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors text-sm">
                {t('saveEntry')}
              </button>
           </div>
        </form>
      )}

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 border-b border-slate-800">{t('date')}</th>
                <th className="p-4 border-b border-slate-800">{t('type')}</th>
                <th className="p-4 border-b border-slate-800">{t('category')}</th>
                <th className="p-4 border-b border-slate-800">{t('note')}</th>
                <th className="p-4 border-b border-slate-800 text-right">{t('amount')}</th>
                <th className="p-4 border-b border-slate-800 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4 text-sm text-slate-300 font-mono">{tx.date}</td>
                  <td className="p-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(tx.type)}`}>
                        {getTypeIcon(tx.type)}
                        <span className="ml-1 capitalize">{t(tx.type as any)}</span>
                     </span>
                  </td>
                  <td className="p-4 text-sm text-slate-300">{t(tx.category as any) || tx.category}</td>
                  <td className="p-4 text-sm text-slate-400">{tx.note || '-'}</td>
                  <td className={`p-4 text-sm font-semibold text-right ${tx.type === 'expense' ? 'text-white' : 'text-green-400'}`}>
                    {tx.type === 'expense' ? '-' : '+'}€{tx.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                        {t('noTransactionsFound')} {canUseScanner ? t('orScan') : ''}
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;