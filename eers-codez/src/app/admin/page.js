'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft,
    UserPlus,
    Upload,
    Trash2,
    RefreshCw,
    Search,
    ShieldCheck,
    AlertCircle,
    FileSpreadsheet,
    Users,
    Database,
    ChevronRight,
    MoreVertical,
    X,
    CheckCircle2,
    Lock
} from 'lucide-react';

export default function AdminPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isSeeding, setIsSeeding] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', leetcodeUsername: '', registerNumber: '', batch: '' });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const r = await fetch('/api/leaderboard');
            const data = await r.json();
            setStudents(data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        setIsSeeding(true);
        setMessage({ type: 'info', text: 'Initializing batch ingestion...' });
        try {
            const r = await fetch('/api/seed', { method: 'POST' });
            const data = await r.json();
            setMessage({ type: 'success', text: data.message || 'Ingestion complete' });
            fetchStudents();
        } catch (err) {
            setMessage({ type: 'error', text: 'Ingestion uplink failed' });
        } finally {
            setIsSeeding(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setMessage({ type: 'info', text: 'Synchronizing global intelligence...' });
        try {
            const r = await fetch('/api/refresh', { method: 'POST' });
            const data = await r.json();
            setMessage({ type: 'success', text: data.message || 'Synchronization successful' });
            fetchStudents();
        } catch (err) {
            setMessage({ type: 'error', text: 'Sync uplink failed' });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async (username) => {
        if (!confirm(`Are you sure you want to neutralize target @${username}?`)) return;
        try {
            const r = await fetch(`/api/admin/students?username=${username}`, { method: 'DELETE' });
            if (r.ok) {
                setMessage({ type: 'success', text: 'Target neutralized' });
                fetchStudents();
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Neutralization failed' });
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const r = await fetch('/api/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent)
            });
            if (r.ok) {
                setMessage({ type: 'success', text: 'New asset registered' });
                setShowAddModal(false);
                setNewStudent({ name: '', leetcodeUsername: '', registerNumber: '', batch: '' });
                fetchStudents();
            } else {
                const data = await r.json();
                setMessage({ type: 'error', text: data.error || 'Registration failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Registration uplink failed' });
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.leetcodeUsername.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
            <div className="mesh-bg opacity-30" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Exit Secure Terminal
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/5">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Intelligence Ops</h1>
                            <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-1 animate-pulse">Classified Access Only</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Register Asset
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Synchronizing...' : 'Global Sync'}
                    </button>
                    <button
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Upload size={18} />
                        {isSeeding ? 'Ingesting...' : 'Ingest Excel'}
                    </button>
                </div>
            </div>

            {/* Status Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`mb-8 p-4 rounded-xl border flex items-center justify-between backdrop-blur-md ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                message.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {message.type === 'success' ? <CheckCircle2 size={20} /> :
                                message.type === 'error' ? <AlertCircle size={20} /> : <Database size={20} />}
                            <span className="text-sm font-bold uppercase tracking-tight">{message.text}</span>
                        </div>
                        <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100">
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
                <div className="glass-card p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Assets</span>
                        <Users size={18} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-black text-white">{students.length}</div>
                </div>
                <div className="glass-card p-6 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Integrity</span>
                        <ShieldCheck size={18} className="text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-white">99.8%</div>
                </div>
                <div className="glass-card p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Last Refresh</span>
                        <RefreshCw size={18} className="text-purple-500" />
                    </div>
                    <div className="text-3xl font-black text-white">4h ago</div>
                </div>
            </div>

            {/* Asset List */}
            <div className="glass-card overflow-hidden relative z-10">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Users size={20} className="text-slate-500" /> Asset Directory
                    </h3>
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Intelligence Signature..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Name</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Signature</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Register #</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.map((s) => (
                                <tr key={s._id} className="table-row-hover group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm">
                                                {s.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-blue-400">@{s.leetcodeUsername}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{s.registerNumber || 'UNASSIGNED'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(s.leetcodeUsername)}
                                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredStudents.length === 0 && !loading && (
                        <div className="p-12 text-center">
                            <Users size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No assets found in current sector</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Asset Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-card w-full max-w-md p-8 relative z-10 border border-white/10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Register New Asset</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddStudent} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">LeetCode Identifier</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.leetcodeUsername}
                                        onChange={(e) => setNewStudent({ ...newStudent, leetcodeUsername: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                        placeholder="username"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Register #</label>
                                        <input
                                            type="text"
                                            value={newStudent.registerNumber}
                                            onChange={(e) => setNewStudent({ ...newStudent, registerNumber: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Batch</label>
                                        <input
                                            type="text"
                                            value={newStudent.batch}
                                            onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                                            placeholder="2025"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-full py-4 mt-4 font-black uppercase tracking-widest shadow-blue-500/20">
                                    Initiate Registration
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
