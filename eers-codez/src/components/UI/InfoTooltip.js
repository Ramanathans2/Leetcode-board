'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { METRIC_DEFINITIONS } from '@/lib/metricDefinitions';

export default function InfoTooltip({ metricKey, data, children, position = "top" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const config = METRIC_DEFINITIONS[metricKey];

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!config) return children;

    const TooltipContent = () => (
        <div className="w-80 p-6 text-left relative z-10">
            <h4 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Info size={16} className="text-blue-500" /> {config.title}
            </h4>

            <div className="mb-5 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[11px] text-emerald-400/90 leading-relaxed shadow-inner backdrop-blur-sm">
                <div className="text-slate-500 mb-1.5 font-black uppercase tracking-[0.2em] text-[8px] opacity-60">Calculation Formula</div>
                {config.formula}
            </div>

            <p className="text-[11px] font-bold text-slate-300 leading-relaxed mb-5">
                {config.description}
            </p>

            <div className="mb-5">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 opacity-60">Intelligence Logic</div>
                <p className="text-[11px] text-slate-400 italic leading-snug">"{config.algorithm}"</p>
            </div>

            <div className="pt-4 border-t border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 opacity-60">Worked Example</div>
                <div className="text-[11px] text-blue-300/80 font-bold leading-normal bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                    {config.example(data || {})}
                </div>
            </div>
        </div>
    );

    const handleInteraction = (state) => {
        if (!isMobile) setIsOpen(state);
    };

    const toggleModal = () => {
        if (isMobile) setIsOpen(!isOpen);
    };

    const posClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-4",
        right: "left-full top-1/2 -translate-y-1/2 ml-4",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-4",
        left: "right-full top-1/2 -translate-y-1/2 mr-4"
    };

    return (
        <div className="relative inline-flex items-center group">
            <div className="flex items-center gap-1.5">
                {children}
                <motion.button
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleModal}
                    onMouseEnter={() => handleInteraction(true)}
                    onMouseLeave={() => handleInteraction(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-slate-500 hover:text-blue-400 transition-all cursor-help"
                >
                    <Info size={12} />
                </motion.button>
            </div>

            <AnimatePresence>
                {isOpen && !isMobile && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className={`absolute z-[100] ${posClasses[position]}`}
                    >
                        <div className="glass-card border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-3xl bg-slate-950/90 overflow-hidden ring-1 ring-white/10">
                            <TooltipContent />
                            {/* Pointer bubble */}
                            <div className={`absolute w-3 h-3 bg-slate-950/90 rotate-45 border-r border-b border-white/10 z-0
                                ${position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' : ''}
                                ${position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' : ''}
                                ${position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' : ''}
                                ${position === 'right' ? 'left-[-6px] top-1/2 -translate-y-1/2' : ''}
                            `} />
                        </div>
                    </motion.div>
                )}

                {isOpen && isMobile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass-card w-full max-w-sm bg-slate-950 overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-end p-4 pb-0">
                                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <TooltipContent />
                            <div className="p-6 pt-0">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10"
                                >
                                    Dismiss Intel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
