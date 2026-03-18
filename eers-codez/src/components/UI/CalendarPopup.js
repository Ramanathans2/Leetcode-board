'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function CalendarPopup({ isOpen, onClose, onSelect, selectedDate }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(selectedDate || today);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const handleDateClick = (day) => {
        const d = new Date(Date.UTC(year, month, day));
        onSelect(d);
        onClose();
    };

    const isToday = (day) => {
        const d = new Date();
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        return selectedDate.getUTCDate() === day && selectedDate.getUTCMonth() === month && selectedDate.getUTCFullYear() === year;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] glass-card p-6 z-[101] border border-white/10 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">{monthNames[month]} {year}</h3>
                            <div className="flex items-center gap-1">
                                <button onClick={prevMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={nextMonth} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                                <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors ml-2">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-600 uppercase py-2">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-10" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDateClick(day)}
                                        className={`h-10 w-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all
                                            ${isSelected(day) ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' :
                                                isToday(day) ? 'bg-white/10 text-blue-400 border border-blue-500/30' :
                                                    'hover:bg-white/5 text-slate-300'}`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                            <button
                                onClick={() => handleDateClick(new Date().getUTCDate())}
                                className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                            >
                                Jump to Today
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
