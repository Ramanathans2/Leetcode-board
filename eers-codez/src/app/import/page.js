'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, User, Loader2, CheckCircle2, AlertCircle, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

export default function ImportPage() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);
    const [roster, setRoster] = useState([]);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchRoster = async () => {
        setRosterLoading(true);
        try {
            const res = await fetch('/api/students');
            const data = await res.json();
            if (Array.isArray(data)) setRoster(data);
        } catch (error) {
            console.error('Failed to fetch roster:', error);
        } finally {
            setRosterLoading(false);
        }
    };

    useState(() => {
        fetchRoster();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setIsError(false);

        try {
            const res = await fetch('/api/students/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, leetcodeUsername: username }),
            });

            const data = await res.json();

            if (!res.ok) {
                setIsError(true);
                setMessage(data.error || 'Failed to import student');
            } else {
                setMessage('Student successfully integrated into the collective');
                setName('');
                setUsername('');
                fetchRoster();
            }
        } catch (error) {
            setIsError(true);
            setMessage('A systemic failure occurred. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (leetcodeUsername) => {
        if (!confirm(`Confirm severance of operative @${leetcodeUsername}?`)) return;
        
        setDeletingId(leetcodeUsername);
        try {
            const res = await fetch('/api/students', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leetcodeUsername }),
            });

            if (res.ok) {
                setRoster(prev => prev.filter(s => s.leetcodeUsername !== leetcodeUsername));
            } else {
                const data = await res.json();
                alert(data.error || 'Severance protocol failed');
            }
        } catch (error) {
            alert('A systemic failure occurred during severance');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-8 pt-20">
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left side: Import Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                >
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 mb-2 transition-colors no-underline group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Roster</span>
                    </Link>

                    <div className="glass-card p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <UserPlus size={80} className="text-blue-500" />
                        </div>

                        <div className="relative z-10">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-2">
                                Import <span className="neon-blue">Operative</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-8">
                                Register new intelligence unit
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Display Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Full Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-blue-500/50 transition-all uppercase tracking-tight"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        LeetCode Username
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs">@</div>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-700 outline-none focus:border-blue-500/50 transition-all tracking-tight"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: '#3b82f6' }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                    className="w-full bg-blue-600 disabled:bg-blue-800 disabled:opacity-50 text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] text-xs transition-colors shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Analyzing Profile...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={16} />
                                            <span>Import Student</span>
                                        </>
                                    )}
                                </motion.button>
                            </form>

                            <AnimatePresence>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`mt-6 p-4 rounded-xl flex items-center gap-3 border ${
                                            isError 
                                                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        }`}
                                    >
                                        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                                        <span className="text-xs font-bold uppercase tracking-wider">{message}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* Right side: Operational Roster */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-8 min-h-[500px] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                                Operational <span className="text-blue-400">Roster</span>
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {roster.length} Active intelligence units
                            </p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <AlertCircle size={20} />
                        </div>
                    </div>

                    <div className="flex-grow space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {rosterLoading && roster.length === 0 ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 skeleton rounded-xl border border-white/5" />
                                ))
                            ) : roster.length > 0 ? (
                                roster.map((student) => (
                                    <motion.div
                                        key={student.leetcodeUsername}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ 
                                            opacity: 0, 
                                            x: 50, 
                                            filter: 'blur(10px)',
                                            transition: { duration: 0.3, ease: 'easeIn' }
                                        }}
                                        layout
                                        className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-black">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-white uppercase tracking-tight">{student.name}</div>
                                                <div className="text-[10px] text-slate-500 font-bold">@{student.leetcodeUsername}</div>
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.2, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => handleDelete(student.leetcodeUsername)}
                                            disabled={deletingId === student.leetcodeUsername}
                                            className="p-2 rounded-lg text-red-500/40 hover:text-red-500 transition-colors"
                                            title="Sever Operative"
                                        >
                                            {deletingId === student.leetcodeUsername ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <X size={16} />
                                            )}
                                        </motion.button>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 space-y-4 pt-12">
                                    <UserPlus size={48} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Collective buffer empty</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
