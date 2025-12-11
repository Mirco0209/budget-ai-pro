import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Calendar, Tag, FileText, ArrowDownLeft, ArrowUpRight, Camera, Loader, Sparkles, Lock } from 'lucide-react';
import { storageService } from '../services/storageService';
import { analyzeReceipt } from '../services/geminiService';
import { Transaction, TransactionType, CATEGORIES } from '../types';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'expense',
    category: 'Other',
    note: ''
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [canUseScanner, setCanUseScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTransactions(storageService.getTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Check Plan for Scanner Feature (Available on Medium, Advanced, Ultra)
    const settings = storageService.getSettings();
    const allowedPlans = ['medium', 'advanced', 'ultra'];
    setCanUseScanner(allowedPlans.includes(settings.plan));
  }, []);

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
    
    // Reset form partially
    setFormData({ ...formData, amount: 0, note: '' });
  };

  const handleDelete = (id: string) => {
    const updated = storageService.deleteTransaction(id);
    setTransactions(updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleScanClick = () => {
    if (!canUseScanner) {
        alert("Upgrade to the Medium plan to unlock AI Receipt Scanning!");
        return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setIsFormOpen(true); // Ensure form is visible

    try {
      // Convert to base64
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
          <h2 className="text-2xl font-bold text-white">Transactions</h2>
          <p className="text-slate-400">Manage your daily movements</p>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={handleScanClick}
                disabled={isScanning}
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
                    {isScanning ? 'Scanning...' : canUseScanner ? 'Scan AI' : 'Scan Locked'}
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
            <span className="hidden md:inline">Add New</span>
            </button>
        </div>
      </div>

      {/* Add Form Panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-fade-in mb-8 relative overflow-hidden">
           {isScanning && (
               <div className="absolute inset-0 bg-slate-950/80 z-10 flex flex-col items-center justify-center">
                   <div className="relative">
                       <Sparkles size={48} className="text-purple-500 animate-pulse" />
                   </div>
                   <p className="text-purple-300 mt-4 font-medium">Gemini is reading your receipt...</p>
               </div>
           )}
           
           <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               New Entry
               {formData.note?.includes('Receipt') && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Auto-filled by AI</span>}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Date</label>
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
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary text-white"
                >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="refund">Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                 <div className="relative">
                   <Tag size={16} className="absolute left-3 top-3 text-slate-500" />
                   <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-primary text-white"
                   >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary text-white"
                  placeholder="0.00" 
                />
              </div>

              <div>
                 <label className="block text-xs text-slate-400 mb-1">Note</label>
                 <div className="relative">
                    <FileText size={16} className="absolute left-3 top-3 text-slate-500" />
                    <input 
                      type="text" 
                      value={formData.note}
                      onChange={e => setFormData({...formData, note: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-primary text-white"
                      placeholder="Details..." 
                    />
                 </div>
              </div>
           </div>
           <div className="mt-4 flex justify-end">
              <button type="submit" className="bg-white text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-slate-200 transition-colors text-sm">
                Save Entry
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
                <th className="p-4 border-b border-slate-800">Date</th>
                <th className="p-4 border-b border-slate-800">Type</th>
                <th className="p-4 border-b border-slate-800">Category</th>
                <th className="p-4 border-b border-slate-800">Note</th>
                <th className="p-4 border-b border-slate-800 text-right">Amount</th>
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
                        <span className="ml-1 capitalize">{tx.type}</span>
                     </span>
                  </td>
                  <td className="p-4 text-sm text-slate-300">{tx.category}</td>
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
                        No transactions found. Add one manually {canUseScanner ? 'or scan a receipt!' : ''}
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