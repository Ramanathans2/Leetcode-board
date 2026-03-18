'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSyncRefresh } from '@/hooks/useSync';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, CartesianGrid
} from 'recharts';
import {
    Zap, Users, Clock, Target, Activity, Flame,
    TrendingUp, Award, Info, ChevronRight, ZapOff, RefreshCw
} from 'lucide-react';
import InfoTooltip from '@/components/UI/InfoTooltip';
import ClickableUsername from '@/components/UI/ClickableUsername';
import DateSelector from '@/components/UI/DateSelector';
import CalendarPopup from '@/components/UI/CalendarPopup';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-card px-4 py-3 border border-white/10 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black text-slate-500 uppercase tracking-tighter mb-2">{payload[0]?.payload?.fullName || payload[0]?.payload?.name}</p>
            <div className="space-y-1.5">
                <div className="flex justify-between items-center gap-8">
                    <span className="text-[10px] font-bold text-slate-400">IMPACT SCORE</span>
                    <span className="text-sm font-black text-blue-400">{payload[0]?.payload?.impactScore || payload[0]?.value}</span>
                </div>
                {payload[0]?.payload?.easy !== undefined && (
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                        <div className="text-center">
                            <div className="text-[8px] font-bold text-emerald-500/50 uppercase">EASY</div>
                            <div className="text-xs font-black text-emerald-400">{payload[0].payload.easy}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[8px] font-bold text-blue-500/50 uppercase">MED</div>
                            <div className="text-xs font-black text-blue-400">{payload[0].payload.medium}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[8px] font-bold text-rose-500/50 uppercase">HARD</div>
                            <div className="text-xs font-black text-rose-400">{payload[0].payload.hard}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, subValue, color, delay, metricKey }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.4 }}
        className="glass-card p-5 relative overflow-hidden group"
    >
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-125">
            <Icon size={80} />
        </div>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl border border-white/10 bg-white/5" style={{ color }}>
                <Icon size={18} />
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {metricKey ? (
                    <InfoTooltip metricKey={metricKey} position="bottom">{label}</InfoTooltip>
                ) : label}
            </div>
        </div>
        <div className="flex items-end gap-2">
            <div className="text-4xl font-black tracking-tighter" style={{ color }}>{value}</div>
            {subValue && <div className="text-[10px] font-bold text-slate-600 mb-1.5">{subValue}</div>}
        </div>
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
);

const ActivityFeed = ({ activities = [] }) => (
    <div className="space-y-3 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
            {activities?.length > 0 ? activities.map((act, i) => (
                <motion.div
                    key={act.timestamp + act.studentName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold ring-1 ring-blue-500/20">
                            {act.studentName.charAt(0)}
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{act.studentName}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{act.title}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-blue-500/50 uppercase whitespace-nowrap">LATEST STATUS</div>
                        <div className="text-[9px] text-slate-600 font-bold">{new Date(act.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </motion.div>
            )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-2">
                    <Activity size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest">Scanning for life signs...</p>
                </div>
            )}
        </AnimatePresence>
    </div>
);

const ResetTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <Clock size={16} className="text-slate-500" />
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Next Reset In</span>
                <span className="text-sm font-black text-white tabular-nums tracking-tighter">{timeLeft}</span>
            </div>
        </div>
    );
};

export default function DailyPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);

    const isToday = useMemo(() => {
        const today = new Date();
        return selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear();
    }, [selectedDate]);

    const fetchDaily = useCallback(async (targetDate = selectedDate) => {
        setLoading(true);
        try {
            const dateStr = targetDate.toISOString().split('T')[0];
            const res = await fetch(`/api/daily?date=${dateStr}`);
            const d = await res.json();
            setData(d);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchDaily(selectedDate);
        if (isToday) {
            const interval = setInterval(() => fetchDaily(selectedDate), 60000);
            return () => clearInterval(interval);
        }
    }, [fetchDaily, selectedDate, isToday]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    useSyncRefresh(() => fetchDaily(selectedDate));

    const chartData = useMemo(() => {
        if (!data?.students) return [];
        return data.students
            .filter(s => (s.todaySolved || 0) > 0)
            .map(s => ({
                name: (s.name || 'Unknown').split(' ')[0],
                solved: s.todaySolved || 0,
                fullName: s.name || 'Unknown',
                impactScore: s.impactScore || 0,
                easy: s.easy || 0,
                medium: s.medium || 0,
                hard: s.hard || 0
            }));
    }, [data]);

    if (loading) return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div className="skeleton h-10 w-64" />
                <div className="skeleton h-12 w-32" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="skeleton h-96 lg:col-span-2" />
                <div className="skeleton h-96" />
            </div>
        </div>
    );

    if (!data) return null;
    if (data.error) return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <ZapOff size={48} className="text-rose-500/50" />
            <div className="text-center">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Operational Failure</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">{data.error}</p>
            </div>
            <button
                onClick={() => fetchDaily(selectedDate)}
                className="px-6 py-2 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-colors"
            >
                Retry Uplink
            </button>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Dormant Mode Banner */}
            {data.isDormant && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                            <ZapOff size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-500 uppercase tracking-widest">
                                {isToday ? 'Dormant Mode Activated' : 'No Activity Recorded'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                                {isToday
                                    ? `Awaiting the first submission of the day. Showing last active performance from ${new Date(data.activeSnapDate).toDateString()}.`
                                    : `No performance data was captured for the batch on ${selectedDate.toDateString()}.`
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
            {/* Header / Today's Pulse */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg border transition-colors ${isToday ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {isToday ? <Activity size={16} /> : <Clock size={16} />}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isToday ? 'text-emerald-500 active-pulse' : 'text-blue-500'}`}>
                            {isToday ? 'Live Feed Active' : 'Historical Record'}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                        Daily <span className="text-blue-500">Intelligence</span> Panel
                    </h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">
                        {isToday ? 'Viewing Real-Time Performance Uplink' : `Archival sequence for ${selectedDate.toDateString()}`}
                    </p>
                </motion.div>

                <div className="flex items-center gap-4">
                    {isToday && <ResetTimer />}
                    <DateSelector date={selectedDate} onClick={() => setShowCalendar(true)} />
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => isToday ? window.location.reload() : fetchDaily(selectedDate)}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl transition-colors"
                    >
                        {isToday ? <TrendingUp size={20} className="text-blue-400" /> : <RefreshCw size={20} className="text-blue-400" />}
                    </motion.button>
                    <CalendarPopup
                        isOpen={showCalendar}
                        onClose={() => setShowCalendar(false)}
                        onSelect={handleDateSelect}
                        selectedDate={selectedDate}
                    />
                </div>
            </header>

            {/* Today's Pulse Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Zap} label="Total Solved" value={data.totalToday || 0} subValue={`vs yesterday: ${data.totalYesterday || 0}`} color="#60A5FA" delay={0.1} />
                <StatCard icon={Users} label="Active Students" value={data.active || 0} subValue={`/ ${data.totalStudents || 0} total`} color="#34D399" delay={0.2} />
                <StatCard 
                    icon={Clock} 
                    label="Latest Submission" 
                    value={data.latestSubmissionTime ? new Date(data.latestSubmissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'} 
                    subValue={data.latestSubmissionStudent ? `By ${data.latestSubmissionStudent}` : "Synchronized"} 
                    color="#8B5CF6" 
                    delay={0.3} 
                />
                <StatCard icon={Award} label="Impact Score" value={data.impactScore || 0} subValue={`Delta: ${data.diffPercent || 0}%`} color="#FBBF24" delay={0.4} metricKey="IMPACT_SCORE" />
            </div>

            {/* Analytics Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Individual Velocity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="glass-card p-8 lg:col-span-8 overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Individual Velocity</h3>
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Global solved today per student</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-[8px] font-black text-amber-500 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> MVP Gold</div>
                            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Active Tier</div>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ bottom: 40 }}>
                            <defs>
                                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FCD34D" />
                                    <stop offset="100%" stopColor="#F59E0B" />
                                </linearGradient>
                                <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#CBD5E1" />
                                    <stop offset="100%" stopColor="#94A3B8" />
                                </linearGradient>
                                <linearGradient id="bronzeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#D97706" />
                                    <stop offset="100%" stopColor="#92400E" />
                                </linearGradient>
                                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#1D4ED8" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: '#64748B', fontSize: 10, fontWeight: 900 }}
                                axisLine={false}
                                tickLine={false}
                                angle={-90}
                                textAnchor="end"
                                interval={0}
                                height={80}
                            />
                            <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            <Bar dataKey="solved" radius={[4, 4, 0, 0]} barSize={28}>
                                {chartData.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={i === 0 ? 'url(#goldGradient)' : i === 1 ? 'url(#silverGradient)' : i === 2 ? 'url(#bronzeGradient)' : 'url(#blueGradient)'}
                                        className={i === 0 ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]' : ''}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Difficulty Intelligence */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="glass-card p-8 lg:col-span-4"
                >
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Difficulty Intel</h3>

                    <div className="relative h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Easy', value: data.breakdown?.easy || 0, color: '#10B981' },
                                        { name: 'Medium', value: data.breakdown?.medium || 0, color: '#3B82F6' },
                                        { name: 'Hard', value: data.breakdown?.hard || 0, color: '#EF4444' }
                                    ].filter(v => v.value > 0)}
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationDuration={1500}
                                    stroke="none"
                                >
                                    {[
                                        { name: 'Easy', color: '#10B981' },
                                        { name: 'Medium', color: '#3B82F6' },
                                        { name: 'Hard', color: '#EF4444' }
                                    ].filter(d => (data.breakdown?.[d.name.toLowerCase()] || 0) > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-white leading-none">{data.breakdown?.total || 0}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Fixed</span>
                            <div className={`mt-2 flex items-center gap-1 text-[10px] font-black ${(data.diffPercent || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {(data.diffPercent || 0) >= 0 ? '+' : ''}{data.diffPercent || 0}%
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        {[
                            { name: 'Easy', val: data.breakdown?.easy || 0, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
                            { name: 'Medium', val: data.breakdown?.medium || 0, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
                            { name: 'Hard', val: data.breakdown?.hard || 0, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }
                        ].map(d => (
                            <div key={d.name} className="flex items-center justify-between p-3 rounded-xl border border-white/5" style={{ background: d.bg }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{d.name}</span>
                                </div>
                                <span className="text-sm font-black text-white">{d.val}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Activity and Insights Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* Live Activity */}
                <div className="glass-card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-blue-500 animate-pulse" /> Live Activity
                        </h3>
                        <div className="text-[10px] font-bold text-slate-600 uppercase">Today</div>
                    </div>
                    <ActivityFeed activities={data.activityFeed} />
                </div>

                {/* Batch Goal Tracker */}
                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Target size={14} className="text-emerald-500" /> Daily Mission Target
                        </h3>
                        <div className="text-4xl font-black text-white mb-2">{data.goal?.current || 0} <span className="text-slate-700">/ {data.goal?.target || 20}</span></div>
                        <p className="text-xs text-slate-500 font-medium mb-8 uppercase tracking-widest">Global batch objective for this cycle</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{data.goal?.percent || 0}% Complete</span>
                            <span className="text-[10px] font-black text-slate-700 uppercase">{(data.goal?.target || 20) - (data.goal?.current || 0)} Left</span>
                        </div>
                        <div className="h-4 bg-white/5 rounded-full border border-white/10 overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${data.goal?.percent || 0}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Daily Micro-Insights */}
                <div className="glass-card p-6 flex flex-col">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Info size={14} className="text-blue-400" /> Intelligence Insights
                    </h3>
                    <div className="space-y-4">
                        {data.insights?.map((insight, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + (idx * 0.1) }}
                                className="p-4 rounded-xl border border-white/5 bg-white/5 flex gap-4 hover:bg-white/10 transition-colors"
                            >
                                <div className={`p-2 h-fit rounded-lg ${insight.type === 'growth' ? 'bg-emerald-500/10 text-emerald-400' : insight.type === 'difficulty' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {insight.type === 'growth' ? <TrendingUp size={16} /> : insight.type === 'difficulty' ? <Target size={16} /> : <Award size={16} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-300 leading-relaxed">{insight.text}</p>
                                </div>
                            </motion.div>
                        ))}
                        {(!data.insights || data.insights.length === 0) && (
                            <div className="text-center py-10">
                                <Activity size={32} className="mx-auto text-slate-700 mb-4 opacity-50" />
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Aggregating trends...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Roster */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                className="glass-card overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Operational Roster</h3>
                    <div className="flex gap-2">
                        <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">Active Intelligence</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="text-left py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Solved</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Solved</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <InfoTooltip metricKey="DIFFICULTY_INDEX">Efficiency</InfoTooltip>
                                </th>
                                <th className="text-right py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.students?.map((s, i) => (
                                <React.Fragment key={s.leetcodeUsername}>
                                    <tr className={`table-row-hover group border-b border-white/5 transition-colors ${expandedRow === s.leetcodeUsername ? 'bg-white/[0.02]' : ''}`}>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-blue-400 group-hover:border-blue-500/50 transition-colors">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm text-slate-200 uppercase tracking-tight group-hover:text-white transition-colors">{s.name}</div>
                                                    <ClickableUsername username={s.leetcodeUsername} className="text-[10px]" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4 font-black">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                                                    <span style={{ color: '#22c55e' }}>{s.easy || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3b82f4' }} />
                                                    <span style={{ color: '#3b82f4' }}>{s.medium || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                                                    <span style={{ color: '#ef4444' }}>{s.hard || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-black text-slate-400">{s.todaySolved} Solved</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${Math.min((s.impactScore / 20) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setExpandedRow(expandedRow === s.leetcodeUsername ? null : s.leetcodeUsername)}
                                                className={`p-2 rounded-lg transition-all duration-300 ${expandedRow === s.leetcodeUsername ? 'bg-blue-500 text-white rotate-90' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                            >
                                                <ChevronRight size={16} />
                                            </motion.button>
                                        </td>
                                    </tr>
                                    <AnimatePresence>
                                        {expandedRow === s.leetcodeUsername && (
                                            <motion.tr
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-black/20"
                                            >
                                                <td colSpan="5" className="p-0 border-b border-white/5">
                                                    <div className="px-6 py-6 overflow-hidden">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            {/* Easy Column */}
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Easy Acquisitions</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {(s.solvedProblems || []).filter(p => p.difficulty?.toLowerCase() === 'easy').length > 0 ? (
                                                                        (s.solvedProblems || []).filter(p => p.difficulty?.toLowerCase() === 'easy').map((p, idx) => (
                                                                            <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-bold text-slate-300">
                                                                                {p.title}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic ml-3">No targets fixed</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Medium Column */}
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Medium Assignments</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {(s.solvedProblems || []).filter(p => p.difficulty?.toLowerCase() === 'medium').length > 0 ? (
                                                                        (s.solvedProblems || []).filter(p => p.difficulty?.toLowerCase() === 'medium').map((p, idx) => (
                                                                            <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-bold text-slate-300">
                                                                                {p.title}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic ml-3">No targets fixed</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Hard Column */}
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">High-Risk Hardware</span>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {(s.solvedProblems || []).filter(p => p.difficulty?.toLowerCase() === 'hard').length > 0 ? (
                                                                        (s.solvedProblems || []).filter(p => p.difficulty?.toLowerCase() === 'hard').map((p, idx) => (
                                                                            <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-bold text-slate-300">
                                                                                {p.title}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic ml-3">No targets fixed</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
