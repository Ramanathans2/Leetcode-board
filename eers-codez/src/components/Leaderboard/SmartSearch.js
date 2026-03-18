'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Terminal } from 'lucide-react';

const SUGGESTIONS = [
    { label: 'tier:elite', description: 'Show top tier students' },
    { label: 'tier:advanced', description: 'Show advanced tier students' },
    { label: 'inactive:3', description: 'Silent for 3+ days' },
    { label: 'solved>30', description: 'More than 30 solved' },
    { label: 'medium>5', description: 'Medium challenge focus' }
];

export default function SmartSearch({ value, onChange, onClear }) {
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsFocused(false);
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputFocus = () => {
        setIsFocused(true);
        if (!value) setShowSuggestions(true);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(val);
        // Show suggestions if typing a colon or comparison operator
        if (val.endsWith(':') || val.endsWith('>') || val.endsWith('<')) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (suggestion) => {
        onChange(suggestion);
        setShowSuggestions(false);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <motion.div
                animate={{ 
                    width: isFocused ? '110%' : '100%',
                    x: isFocused ? '-5%' : '0%'
                }}
                className={`relative group h-12 flex items-center bg-white/5 border rounded-xl overflow-hidden transition-all duration-300 ${
                    isFocused ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-blue-500/5' : 'border-white/10'
                }`}
            >
                <motion.div 
                    animate={{ color: isFocused ? '#60A5FA' : '#64748B', scale: isFocused ? 1.1 : 1 }}
                    className="pl-4 pr-3 transition-colors duration-200"
                >
                    <Search size={18} />
                </motion.div>
                
                <input
                    type="text"
                    placeholder="Search operatives, tiers, or type commands..."
                    value={value}
                    onFocus={handleInputFocus}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent border-none text-sm font-black text-white placeholder:text-slate-600 outline-none uppercase tracking-widest transition-all focus:placeholder:opacity-50"
                />

                {/* Dynamic Underline */}
                <AnimatePresence>
                    {isFocused && value && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '100%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {value && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClear}
                            className="p-3 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Hints Section */}
            {!isFocused && !value && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1"
                >
                    <span>Try:</span>
                    <button onClick={() => selectSuggestion('tier:elite')} className="hover:text-blue-400 transition-colors">tier:elite</button>
                    <button onClick={() => selectSuggestion('inactive:3')} className="hover:text-amber-400 transition-colors">inactive:3</button>
                    <button onClick={() => selectSuggestion('solved>30')} className="hover:text-emerald-400 transition-colors">solved&gt;30</button>
                </motion.div>
            )}

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 glass-card border-white/10 bg-black/60 backdrop-blur-xl p-2 shadow-2xl"
                    >
                        <div className="p-2 border-b border-white/5 mb-2">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                <Terminal size={12} /> Command Intelligence
                            </span>
                        </div>
                        <div className="space-y-1">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s.label}
                                    onClick={() => selectSuggestion(s.label)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ChevronRight size={12} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                                        <span className="text-xs font-bold text-white uppercase tracking-tighter">{s.label}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold italic">{s.description}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
