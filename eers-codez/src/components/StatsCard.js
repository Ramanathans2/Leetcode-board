'use client';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, icon, color = 'blue', delay = 0 }) {
    const colorMap = {
        blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA' },
        yellow: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24' },
        green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#34D399' },
        red: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#F87171' },
        purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)', text: '#A78BFA' },
    };

    const c = colorMap[color] || colorMap.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ 
                duration: 0.2, 
                delay,
                y: { type: "spring", stiffness: 300, damping: 20 }
            }}
            className="glass-card p-6 group/card cursor-default"
            style={{ borderColor: c.border }}>
            <div className="flex items-center justify-between mb-4">
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="text-2xl transition-colors duration-300"
                >
                    {icon}
                </motion.div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all duration-300 group-hover/card:brightness-110"
                    style={{ background: c.bg, color: c.text }}>
                    {title}
                </span>
            </div>
            <div className="text-3xl font-black tracking-tighter" style={{ color: c.text }}>
                {value}
            </div>
        </motion.div>
    );
}
