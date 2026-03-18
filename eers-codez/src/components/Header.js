'use client';
import { useSync } from '@/hooks/useSync';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Header() {
    const { isSyncing, lastSync, triggerSync, status } = useSync();
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        if (!lastSync) return;

        const update = () => {
            const diff = Math.floor((new Date() - new Date(lastSync)) / 1000);
            if (diff < 60) setRelativeTime('just now');
            else if (diff < 3600) setRelativeTime(`${Math.floor(diff / 60)} mins ago`);
            else setRelativeTime(`${Math.floor(diff / 3600)} hours ago`);
        };

        update();
        const interval = setInterval(update, 30000);
        return () => clearInterval(interval);
    }, [lastSync]);

    return (
        <header className="fixed top-0 right-0 z-50 p-4 md:p-6 flex justify-end">
            <div className="flex items-center gap-4">
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                }`}
                        >
                            {status === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                            {status === 'success' ? 'Sync Success' : 'Sync Failed'}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="glass-card px-4 py-2 flex items-center gap-4 border border-white/10 shadow-2xl backdrop-blur-xl">
                    {lastSync && (
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                            <Clock size={12} />
                            <span className="uppercase tracking-widest leading-none">Last Sync: {relativeTime}</span>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={triggerSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all ${isSyncing
                                ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed border border-blue-500/30'
                                : 'bg-white/5 text-white border border-white/10 hover:border-blue-500/30'
                            }`}
                    >
                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </motion.button>
                </div>
            </div>
        </header>
    );
}
