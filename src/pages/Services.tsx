import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Briefcase, Clock } from 'lucide-react';

export default function Services() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl space-y-8"
      >
        {/* Icon Group */}
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
            <Briefcase size={48} />
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20"
          >
            <Sparkles size={24} />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
            Services Marketplace
          </h1>
          <div className="flex items-center justify-center space-x-2 text-slate-500 dark:text-slate-400">
            <Clock size={20} />
            <span className="text-xl font-medium">Coming Soon</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
            We're building a world-class marketplace to connect your business with top-tier agencies and AI-powered service providers. 
            <span className="block mt-2 font-semibold text-blue-600 dark:text-blue-400">Launching in just a few days.</span>
          </p>
        </div>

        {/* Progress Indicator (Visual Only) */}
        <div className="w-full max-w-md mx-auto h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "85%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500"
          />
        </div>

        {/* CTA */}
        <div className="pt-8">
          <button 
            disabled
            className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-2xl cursor-not-allowed transition-all"
          >
            Get Notified on Launch
          </button>
        </div>
      </motion.div>
    </div>
  );
}
