import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Wallet, Target, AlertTriangle, ArrowUpRight, ArrowDownLeft, Clock, Activity, Lock } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState(storageService.getFinancialSummary());
  const [dataForChart, setDataForChart] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [projectionData, setProjectionData] = useState<any[]>([]);
  const [canForecast, setCanForecast] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setSummary(storageService.getFinancialSummary());
    
    // Check Plan for Forecasting (Available on Advanced & Ultra)
    const settings = storageService.getSettings();
    const allowedPlans = ['advanced', 'ultra'];
    setCanForecast(allowedPlans.includes(settings.plan));
  }, []);

  useEffect(() => {
    // Transform summary for charts
    const chartData = [
      { name: t('income'), amount: summary.totalIncome },
      { name: t('expense'), amount: summary.totalExpense },
      { name: t('refund'), amount: summary.totalRefund },
    ];
    setDataForChart(chartData);

    const pData = Object.entries(summary.categoryBreakdown).map(([name, value]) => ({
      name: t(name as any) || name, // Translate category if possible
      value: Number(value)
    })).sort((a, b) => b.value - a.value); // Sort descending
    setPieData(pData);

    // Calculate Projection (Only if allowed, but we calc it anyway for the blurred bg)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const dailyAvg = summary.dailyAverage;
    const currentBalance = summary.balance;
    
    // Create points from today until end of month
    const proj = [];
    let runningBalance = currentBalance;
    
    for (let d = currentDay; d <= daysInMonth; d++) {
        proj.push({
            day: d,
            balance: runningBalance,
            predicted: d === currentDay ? runningBalance : runningBalance - dailyAvg
        });
        if (d > currentDay) runningBalance -= dailyAvg;
    }
    setProjectionData(proj);

  }, [summary, t]);

  const COLORS = ['#f97316', '#a855f7', '#3b82f6', '#22c55e', '#ef4444', '#eab308'];

  // Calculate Savings Color
  const getSavingsColor = (rate: number) => {
    if (rate >= 20) return 'text-green-400';
    if (rate > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard')}</h2>
          <p className="text-slate-400">{t('financialOverview')} {new Date().toLocaleString('default', { month: 'long' })}</p>
        </div>
        <button 
          onClick={() => setSummary(storageService.getFinancialSummary())}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <p className="text-slate-400 text-sm font-medium">{t('totalIncome')}</p>
          <h3 className="text-3xl font-bold text-white mt-2">€{summary.totalIncome.toFixed(2)}</h3>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={80} />
          </div>
          <p className="text-slate-400 text-sm font-medium">{t('totalExpenses')}</p>
          <h3 className="text-3xl font-bold text-white mt-2">€{summary.totalExpense.toFixed(2)}</h3>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={80} />
          </div>
          <p className="text-slate-400 text-sm font-medium">{t('netBalance')}</p>
          <h3 className={`text-3xl font-bold mt-2 ${summary.balance >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
            €{summary.balance.toFixed(2)}
          </h3>
        </div>
      </div>

      {/* Smart Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Savings Rate */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
           <div>
              <div className="flex items-center space-x-2 mb-2 text-slate-400">
                <Target size={18} />
                <span className="text-sm font-medium">{t('savingsRate')}</span>
              </div>
              <p className={`text-2xl font-bold ${getSavingsColor(summary.savingsRate)}`}>
                {summary.savingsRate.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">{t('target')}: 20%</p>
           </div>
           <div className="h-16 w-16 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
              <div 
                className={`absolute inset-0 rounded-full border-4 border-transparent border-t-${summary.savingsRate >= 20 ? 'green' : 'orange'}-500 transform -rotate-45`} 
                style={{ opacity: Math.min(summary.savingsRate / 100, 1) }}
              ></div>
              <span className="text-xs font-bold text-slate-300">{summary.savingsRate > 0 ? t('saved') : t('low')}</span>
           </div>
        </div>

        {/* Daily Average */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
           <div className="flex items-center space-x-2 mb-2 text-slate-400">
             <Clock size={18} />
             <span className="text-sm font-medium">{t('dailyAvg')}</span>
           </div>
           <p className="text-2xl font-bold text-white">€{summary.dailyAverage.toFixed(2)}</p>
           <p className="text-xs text-slate-500 mt-1">{t('perDay')}</p>
        </div>

        {/* Top Category */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
           <div className="flex items-center space-x-2 mb-2 text-slate-400">
             <AlertTriangle size={18} className="text-orange-500" />
             <span className="text-sm font-medium">{t('topExpense')}</span>
           </div>
           <p className="text-xl font-bold text-white truncate">{t(summary.topCategory.name as any) || summary.topCategory.name}</p>
           <p className="text-sm text-red-400 mt-1">-€{summary.topCategory.amount.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts Area */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Forecast Chart (Gated) */}
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                       <Activity className="text-purple-400" size={20} />
                       {t('projectionTitle')}
                   </h3>
                   <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">
                       {t('aiPredicted')}
                   </span>
               </div>
               <div className={`h-64 relative ${!canForecast ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={projectionData}>
                           <defs>
                               <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                   <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                               </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                           <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                           <Tooltip 
                               contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                               formatter={(value: number) => [`€${value.toFixed(2)}`, 'Balance']}
                               labelFormatter={(label) => `Day ${label}`}
                           />
                           <Area type="monotone" dataKey="predicted" stroke="#8884d8" fillOpacity={1} fill="url(#colorBalance)" />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>
               
               {/* Lock Overlay */}
               {!canForecast && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                       <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 backdrop-blur-md flex flex-col items-center text-center">
                           <Lock size={32} className="text-purple-400 mb-2" />
                           <h4 className="text-white font-bold mb-1">{t('forecastLocked')}</h4>
                           <p className="text-slate-400 text-sm max-w-[200px]">{t('upgradeToAdvanced')}</p>
                       </div>
                   </div>
               )}

               <p className="text-xs text-slate-500 text-center mt-2">
                   {t('basedOnAvg')} €{summary.dailyAverage.toFixed(2)}
               </p>
           </div>

           {/* Cash Flow Chart */}
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-6">{t('cashFlow')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataForChart}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                        itemStyle={{ color: '#f8fafc' }}
                        cursor={{fill: '#334155', opacity: 0.2}}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {dataForChart.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : index === 1 ? '#ef4444' : '#3b82f6'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expenses Pie Chart */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-6">{t('expenseBreakdown')}</h3>
              <div className="flex flex-col sm:flex-row items-center">
                 <div className="h-64 w-full sm:w-1/2">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                          </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">{t('noExpensesYet')}</div>
                    )}
                 </div>
                 <div className="w-full sm:w-1/2 grid grid-cols-2 gap-3 mt-4 sm:mt-0">
                    {pieData.slice(0, 6).map((entry, index) => (
                        <div key={index} className="flex items-center text-xs text-slate-300">
                            <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="truncate">{entry.name}</span>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
        </div>

        {/* Recent Transactions Side Panel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit">
           <h3 className="text-lg font-semibold text-white mb-4">{t('recentActivity')}</h3>
           <div className="space-y-4">
             {summary.recentTransactions.length === 0 ? (
               <p className="text-slate-500 text-sm text-center py-4">{t('noActivity')}</p>
             ) : (
               summary.recentTransactions.map((tx) => (
                 <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <div className="flex items-center space-x-3">
                       <div className={`p-2 rounded-lg ${
                         tx.type === 'income' ? 'bg-green-500/10 text-green-500' :
                         tx.type === 'expense' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                       }`}>
                          {tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                       </div>
                       <div>
                          <p className="text-sm font-medium text-white truncate max-w-[100px]">
                            {t(tx.category as any) || tx.category}
                          </p>
                          <p className="text-[10px] text-slate-500">{tx.date}</p>
                       </div>
                    </div>
                    <span className={`text-sm font-bold ${
                         tx.type === 'income' ? 'text-green-400' : 'text-white'
                    }`}>
                      {tx.type === 'expense' ? '-' : '+'}€{tx.amount.toFixed(0)}
                    </span>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;