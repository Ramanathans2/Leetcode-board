'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncRefresh } from '@/hooks/useSync';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import {
    TrendingUp, Calendar, Zap, Award, Target, Info,
    ChevronRight, Trophy, Code2, Cpu, Globe, Rocket
} from 'lucide-react';
import InfoTooltip from '@/components/UI/InfoTooltip';
import ClickableUsername from '@/components/UI/ClickableUsername';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-card px-4 py-3 border border-white/10 shadow-2xl backdrop-blur-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label || payload[0]?.payload?.name}</p>
            <div className="space-y-2">
                <div className="flex justify-between items-center gap-8">
                    <span className="text-[10px] font-bold text-slate-400">VALUE</span>
                    <span className="text-sm font-black text-blue-400">{payload[0].value}</span>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, subValue, color, delay, metricKey }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="glass-card p-6 group relative overflow-hidden"
    >
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-all duration-700 rotate-12 group-hover:scale-125">
            <Icon size={100} />
        </div>
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl border border-white/10 bg-white/5" style={{ color }}>
                <Icon size={18} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                {metricKey ? (
                    <InfoTooltip metricKey={metricKey} position="bottom">{label}</InfoTooltip>
                ) : label}
            </span>
        </div>
        <div className="flex items-end gap-2">
            <div className="text-4xl font-black tracking-tighter" style={{ color }}>{value}</div>
            {subValue && (
                <div className={`text-[10px] font-bold mb-1.5 ${subValue.startsWith('+') ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {subValue}
                </div>
            )}
        </div>
    </motion.div>
);

const WeeklyResetCounter = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const nextSunday = new Date(now);
            nextSunday.setDate(now.getDate() + (7 - now.getDay()));
            nextSunday.setHours(0, 0, 0, 0);
            const diff = nextSunday - now;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-xl border border-white/10">
            <Calendar size={16} className="text-slate-500" />
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Week Resets In</span>
                <span className="text-xs font-black text-white tabular-nums tracking-tighter mt-0.5">{timeLeft}</span>
            </div>
        </div>
    );
};

export default function WeeklyPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchWeekly = useCallback(async () => {
        try {
            const res = await fetch('/api/weekly');
            const d = await res.json();
            setData(d);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWeekly();
        const interval = setInterval(fetchWeekly, 60000); // 1m auto-refresh
        return () => clearInterval(interval);
    }, [fetchWeekly]);

    useSyncRefresh(fetchWeekly);

    const trendData = useMemo(() => {
        if (!data?.trend) return [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return data.trend.map((val, i) => ({ name: days[i], value: val }));
    }, [data]);

    if (loading) return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end mb-10">
                <div className="skeleton h-12 w-64" />
                <div className="skeleton h-14 w-48" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="skeleton h-[400px]" />
                <div className="skeleton h-[400px]" />
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="max-w-[1600px] mx-auto space-y-10">
            {/* Dormant Mode Intelligence Banner */}
            {data.isDormant && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-4 backdrop-blur-xl"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                            <Info size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-blue-400 uppercase tracking-[0.2em]">Intel Cycle: Dormant Mode</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                Current window idle. Spotlighting last active batch performance from {new Date(data.range.start).toLocaleDateString()} — {new Date(data.range.end).toLocaleDateString()}.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
            {/* Header Area */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-4">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <TrendingUp size={16} />
                        </div>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Performance Cycle</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3">
                        Weekly <span className="text-blue-500">Mastery</span> Hub
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">
                        Window: {new Date(data.range.start).toLocaleDateString()} — {new Date(data.range.end).toLocaleDateString()}
                    </p>
                </motion.div>

                <div className="flex flex-wrap gap-4 items-center">
                    <WeeklyResetCounter />
                    <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.location.reload()} 
                        className="p-3 bg-white/5 border border-white/10 rounded-xl group transition-colors"
                    >
                        <Rocket size={20} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                    </motion.button>
                </div>
            </header>

            {/* Performance Matrix */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Zap} label="Weekly Solved" value={data.totalWeekly} subValue={`Batch Velocity`} color="#60A5FA" delay={0.1} />
                <StatCard icon={Target} label="Active Units" value={data.active} subValue={`/ ${data.totalStudents} Global`} color="#34D399" delay={0.2} />
                <StatCard icon={Award} label="Weekly Growth" value={`${data.growth}%`} subValue={data.growth >= 0 ? "+ Trending Up" : "- Downtrend"} color={data.growth >= 0 ? "#10B981" : "#EF4444"} delay={0.3} />
                <StatCard icon={Trophy} label="Batch Impact" value={data.impactScore} subValue={`Aggregated Score`} color="#FBBF24" delay={0.4} metricKey="IMPACT_SCORE" />
            </div>

            {/* Main Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Velocity Trends */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="glass-card p-10 lg:col-span-8 group"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Velocity Timeline</h3>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Growth trajectory for this window</p>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-black text-blue-500/50 uppercase">
                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Solved Count</div>
                        </div>
                    </div>

                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <defs>
                                    <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#8B5CF6" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 900 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 900 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="url(#lineColor)"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#0F172A' }}
                                    activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* MVP Spotlight */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                    className="glass-card p-10 lg:col-span-4 relative overflow-hidden flex flex-col items-center justify-center text-center group"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    {data.topSolver ? (
                        <>
                            <div className="relative z-10 w-24 h-24 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                                <Trophy size={48} className="text-amber-500" />
                                <div className="absolute -top-3 -right-3 bg-amber-500 text-[10px] font-black text-black px-2 py-1 rounded-lg animate-bounce">MVP</div>
                            </div>
                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.5em] mb-2">Weekly Champion</div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{data.topSolver.name}</h2>
                            <p className="text-sm text-slate-500 font-bold mb-8 italic">Dominating the Intelligence Hub</p>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Solved</div>
                                    <div className="text-2xl font-black text-white">{data.topSolver.weeklySolved}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Impact</div>
                                    <div className="text-2xl font-black text-amber-500">{data.topSolver.impactScore}</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative z-10 w-24 h-24 rounded-3xl bg-white/5 border-2 border-white/10 flex items-center justify-center mb-6">
                                <Trophy size={48} className="text-slate-700" />
                            </div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Spotlight Empty</div>
                            <h2 className="text-3xl font-black text-slate-600 uppercase tracking-tighter mb-1">No MVP Yet</h2>
                            <p className="text-sm text-slate-700 font-bold mb-8 italic">The grid awaits its first champion</p>
                            <div className="w-full h-24 bg-white/5 rounded-2xl border border-dashed border-white/10 flex items-center justify-center">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting Fresh Solves</span>
                            </div>
                        </>
                    )}

                    <div className="mt-8 pt-8 border-t border-white/5 w-full flex justify-between items-center px-4">
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" title="Easy" />
                            <div className="w-2 h-2 rounded-full bg-blue-500" title="Medium" />
                            <div className="w-2 h-2 rounded-full bg-rose-500" title="Hard" />
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Difficulty Range</div>
                    </div>
                </motion.div>
            </div>

            {/* Language & Insights Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Intelligence Insights */}
                <div className="glass-card p-8 flex flex-col">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <Info size={16} className="text-blue-500" /> Analytics Feed
                    </h3>
                    <div className="space-y-4 flex-grow">
                        {data.insights.map((insight, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + (idx * 0.1) }}
                                className="p-4 rounded-2xl border border-white/5 bg-white/5 flex gap-4 hover:border-blue-500/30 transition-all cursor-default"
                            >
                                <div className={`p-2 h-fit rounded-lg ${insight.type === 'growth' ? 'bg-emerald-500/10 text-emerald-400' : insight.type === 'difficulty' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {insight.type === 'growth' ? <TrendingUp size={16} /> : insight.type === 'difficulty' ? <Target size={16} /> : <Award size={16} />}
                                </div>
                                <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase tracking-tight">{insight.text}</p>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                        <div className="flex items-center gap-3 text-blue-400">
                            <Zap size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Real-Time Core Processing</span>
                        </div>
                    </div>
                </div>

                {/* Mastery Distribution Pie */}
                <div className="glass-card p-8 group">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                        <Cpu size={16} className="text-emerald-500" /> Mastery Dist.
                    </h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Easy', value: data.breakdown.easy, color: '#10B981' },
                                        { name: 'Medium', value: data.breakdown.medium, color: '#3B82F6' },
                                        { name: 'Hard', value: data.breakdown.hard, color: '#EF4444' }
                                    ].filter(v => v.value > 0)}
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {[
                                        { name: 'Easy', color: '#10B981' },
                                        { name: 'Medium', color: '#3B82F6' },
                                        { name: 'Hard', color: '#EF4444' }
                                    ].filter(d => data.breakdown[d.name.toLowerCase()] > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-white leading-none">{data.totalWeekly}</span>
                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Confirmed</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-8">
                        {['Easy', 'Medium', 'Hard'].map(diff => (
                            <div key={diff} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                <div className="text-[8px] font-black text-slate-600 uppercase mb-1">{diff}</div>
                                <div className="text-sm font-black text-white">{data.breakdown[diff.toLowerCase()]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Language Intelligence Leaders */}
                <div className="glass-card p-8">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <Globe size={16} className="text-amber-500" /> Language Ops
                    </h3>
                    <div className="space-y-6">
                        {Object.entries(data.languages.leaders).map(([lang, leader]) => (
                            <div key={lang} className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                            <Code2 size={16} className="text-blue-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-200">{lang} Specialist</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase">{leader?.count || 0} Solved</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-[11px] font-black text-white uppercase tracking-tight">{leader?.name || 'Searching...'}</div>
                                    <ChevronRight size={14} className="text-slate-700" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {data.languages.distribution.map(lang => (
                            <div key={lang.name} className="flex-shrink-0 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase">
                                {lang.name} ({lang.value})
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Grid: All Students */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                className="glass-card overflow-hidden"
            >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Operational Roster</h3>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Full sequence performance for this cycle</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Synced</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5 text-left">
                                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Rank</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Intelligence Unit</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                    <InfoTooltip metricKey="IMPACT_SCORE" position="bottom">Weekly Impact</InfoTooltip>
                                </th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Sequence</th>
                                <th className="py-5 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Growth</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.students.map((s, i) => (
                                <tr key={s.name} className={`group border-b border-white/5 hover:bg-blue-500/5 transition-all ${s.weeklySolved === 0 ? 'opacity-40 hover:opacity-100' : ''}`}>
                                    <td className="py-6 px-8">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${s.weeklySolved > 0 ? (i === 0 ? 'bg-amber-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-800 text-white' : 'bg-white/5 text-slate-500') : 'bg-white/5 text-slate-700'}`}>
                                            #{i + 1}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl border border-white/5 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform ${s.weeklySolved > 0 ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400' : 'bg-white/5 text-slate-700'}`}>
                                                {s.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-black uppercase tracking-tighter ${s.weeklySolved > 0 ? 'text-white' : 'text-slate-500'}`}>{s.name}</div>
                                                <ClickableUsername username={s.username} className="text-[10px]" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-end gap-2">
                                            <span className={`text-xl font-black ${s.weeklySolved > 0 ? 'text-blue-400' : 'text-slate-700'}`}>+{s.impactScore}</span>
                                            <span className="text-[8px] font-black text-slate-600 uppercase mb-1">{s.weeklySolved} Fixed</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-2">
                                            {s.trend.map((val, idx) => (
                                                <div key={idx} className={`w-1.5 h-6 rounded-full ${val > 0 ? 'bg-blue-500' : 'bg-white/5'}`} style={{ height: `${Math.max(4, Math.min(24, val * 8))}px` }} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-6">
                                            <div className="flex-grow w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min((s.impactScore / 20) * 100, 100)}%` }} />
                                            </div>
                                            <ChevronRight size={16} className="text-slate-800 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
