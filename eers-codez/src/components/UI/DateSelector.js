'use client';
import React from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

export default function DateSelector({ date, onClick }) {
    // Format: "YYYY-MM-DD" or Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-blue-500/30 transition-all group"
        >
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <CalendarIcon size={16} />
            </div>
            <div className="flex flex-col items-start">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Intelligence Window</span>
                <span className="text-xs font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    {formattedDate}
                    <ChevronDown size={12} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </span>
            </div>
        </button>
    );
}
