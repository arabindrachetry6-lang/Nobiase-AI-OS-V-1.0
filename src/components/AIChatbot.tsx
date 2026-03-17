import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: "Hello! I'm your BizOS AI assistant. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await geminiService.chat(userMsg, "The user is currently using the BizOS AI platform.");
      
      try {
        // Try to parse as JSON for tool routing
        const jsonResponse = JSON.parse(response);
        if (jsonResponse.type === 'navigation') {
          // Dispatch custom event for navigation and pre-fill
          window.dispatchEvent(new CustomEvent('bizos-navigation', { 
            detail: { 
              target: jsonResponse.target, 
              tab: jsonResponse.tab, 
              prefill: jsonResponse.prefill 
            } 
          }));
          setChatHistory(prev => [...prev, { role: 'ai', content: jsonResponse.message }]);
        } else {
          setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
        }
      } catch (e) {
        // Not JSON, treat as normal text
        setChatHistory(prev => [...prev, { role: 'ai', content: response }]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center z-50"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900"></span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isExpanded ? '800px' : '400px',
              height: isExpanded ? '80vh' : '600px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-8 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 flex flex-col overflow-hidden transition-all duration-300"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-emerald-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-bold">BizOS AI Assistant</h4>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest">Always Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-lg">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/10 rounded-lg">
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {chatHistory.map((chat, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex",
                    chat.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm",
                    chat.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20" 
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  )}>
                    <div className="markdown-body">
                      <ReactMarkdown>{chat.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-4">
                <button type="button" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Mic size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
