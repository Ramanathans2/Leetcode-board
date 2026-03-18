import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MomentumIndicator({ trend }) {
    if (trend === 'up') return (
        <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <TrendingUp size={12} />
            </motion.div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Improving</span>
        </div>
    );

    if (trend === 'down') return (
        <div className="flex items-center gap-1.5 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <motion.div
                animate={{ y: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <TrendingDown size={12} />
            </motion.div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Declining</span>
        </div>
    );

    return (
        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
            <Minus size={12} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Stable</span>
        </div>
    );
}
