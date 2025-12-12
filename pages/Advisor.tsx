import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Lock } from 'lucide-react';
import { generateFinancialAdvice } from '../services/geminiService';
import { ChatMessage, PLANS } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { storageService } from '../services/storageService';

const Advisor: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check Plan Limits
    const settings = storageService.getSettings();
    const plan = PLANS[settings.plan];
    
    // If AI Limit is 0 (Base plan), lock the page
    if (plan.aiLimit === 0) {
        setIsLocked(true);
    } else {
        setMessages([
            {
              id: 'welcome',
              role: 'model',
              text: t('welcomeMsg'),
              timestamp: Date.now()
            }
        ]);
    }
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isLocked) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Construct history for context
    const historyText = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    
    // Call Gemini
    const responseText = await generateFinancialAdvice(userMsg.text, historyText);

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  if (isLocked) {
      return (
        <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('advisorLocked')}</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    {t('advisorLockedDesc')}
                </p>
                {/* We don't have a direct link to Plans from here in the mock, but conceptually it guides them */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t('recommended')}</p>
                    <p className="text-white font-semibold">Savings Medium / Advanced</p>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <Sparkles className="text-primary" />
           {t('advisorTitle')}
        </h2>
        <p className="text-slate-400">{t('advisorSubtitle')}</p>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user' ? 'bg-slate-700 ml-3' : 'bg-gradient-to-br from-primary to-accent mr-3'
                }`}>
                  {msg.role === 'user' ? <User size={16} className="text-slate-300" /> : <Bot size={16} className="text-white" />}
                </div>
                
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                   msg.role === 'user' 
                   ? 'bg-slate-800 text-slate-100 rounded-tr-sm' 
                   : 'bg-slate-950 border border-slate-800 text-slate-300 rounded-tl-sm'
                }`}>
                   <div dangerouslySetInnerHTML={{ 
                     __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') 
                   }} />
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mr-3 animate-pulse">
                     <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl rounded-tl-sm">
                     <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-150"></div>
                     </div>
                  </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
           <form onSubmit={handleSend} className="relative">
              <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={t('inputPlaceholder')}
                 className="w-full bg-slate-900 text-white rounded-xl py-4 pl-5 pr-14 focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50 placeholder-slate-500"
              />
              <button 
                 type="submit" 
                 disabled={!input.trim() || isLoading}
                 className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-orange-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <Send size={20} />
              </button>
           </form>
           <p className="text-center text-[10px] text-slate-600 mt-2">
              {t('geminiDisclaimer')}
           </p>
        </div>
      </div>
    </div>
  );
};

export default Advisor;