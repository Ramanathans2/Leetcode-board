'use client';
import { useState, useEffect, use, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Area, AreaChart, CartesianGrid
} from 'recharts';
import {
    ArrowLeft,
    Trophy,
    Flame,
    Target,
    Zap,
    Award,
    TrendingUp,
    Activity,
    BarChart3,
    Code2,
    Calendar,
    ChevronRight,
    PieChart as PieChartIcon,
    RefreshCw,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import ClickableUsername from '@/components/UI/ClickableUsername';
import { getLeetCodeProfileURL } from '@/lib/urlUtils';
import { generateClaudePrompt } from '@/lib/promptUtils';

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6366F1'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-card px-4 py-2 border border-white/10 shadow-xl">
            <p className="font-bold text-xs text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                    <p className="text-sm font-bold text-white">{p.name}: {p.value}</p>
                </div>
            ))}
        </div>
    );
};

function SectionHeader({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-4 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
            </div>
        </div>
    );
}

function HeatmapGrid({ data }) {
    if (!data || data.length === 0) return <p className="text-slate-500 text-sm italic">Intelligence blackhole: No activity detected.</p>;

    const maxCount = Math.max(...data.map(d => d.count), 1);

    const getColor = (count) => {
        if (count === 0) return 'rgba(255,255,255,0.03)';
        const intensity = Math.min(count / maxCount, 1);
        if (intensity < 0.25) return 'rgba(59, 130, 246, 0.2)';
        if (intensity < 0.5) return 'rgba(59, 130, 246, 0.4)';
        if (intensity < 0.75) return 'rgba(59, 130, 246, 0.6)';
        return 'rgba(59, 130, 246, 0.9)';
    };

    const weeks = useMemo(() => {
        const w = [];
        for (let i = 0; i < data.length; i += 7) {
            w.push(data.slice(i, i + 7));
        }
        return w;
    }, [data]);

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex gap-[3px]" style={{ minWidth: '800px' }}>
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((day, di) => (
                            <motion.div key={di}
                                whileHover={{ scale: 1.5, zIndex: 10 }}
                                className="w-3 h-3 rounded-[2px] cursor-pointer transition-colors duration-200"
                                style={{ background: getColor(day.count) }}
                                title={`${day.date}: ${day.count} submissions`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Minimal</span>
                <div className="flex gap-1 px-2">
                    {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-[1px]"
                            style={{ background: getColor(v * maxCount) }} />
                    ))}
                </div>
                <span>Peak Performance</span>
            </div>
        </div>
    );
}

export default function ProfilePage({ params }) {
    const { username } = use(params);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/profile/${username}`)
            .then(r => r.json())
            .then(data => { setProfile(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [username]);

    const stats = useMemo(() => {
        if (!profile) return [];
        return [
            { label: 'Easy', value: profile.currentStats?.easy || 0, color: '#10B981', icon: Zap },
            { label: 'Medium', value: profile.currentStats?.medium || 0, color: '#FBBF24', icon: Target },
            { label: 'Hard', value: profile.currentStats?.hard || 0, color: '#EF4444', icon: Trophy },
            { label: 'Consistency', value: `${profile.consistencyScore || 0}%`, color: '#8B5CF6', icon: Award },
            { label: 'Momentum', value: `${profile.momentumScore >= 0 ? '+' : ''}${profile.momentumScore || 0}%`, color: (profile.momentumScore || 0) >= 0 ? '#10B981' : '#EF4444', icon: TrendingUp },
        ];
    }, [profile]);

    const languageData = useMemo(() => {
        if (!profile?.languageBreakdown) return [];
        return Object.entries(profile.languageBreakdown)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [profile]);

    const diffChart = useMemo(() => {
        if (!profile) return [];
        return [
            { name: 'Easy', value: profile.currentStats?.easy || 0, fill: '#10B981' },
            { name: 'Medium', value: profile.currentStats?.medium || 0, fill: '#FBBF24' },
            { name: 'Hard', value: profile.currentStats?.hard || 0, fill: '#EF4444' },
        ];
    }, [profile]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="mesh-bg" />
                <div className="skeleton h-8 w-32 mb-8" />
                <div className="glass-card h-40 w-full mb-8 skeleton" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    {[...Array(5)].map((_, i) => <div key={i} className="glass-card h-24 skeleton" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-card h-64 skeleton" />
                    <div className="glass-card h-64 skeleton" />
                </div>
            </div>
        );
    }

    if (!profile || profile.error) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="mesh-bg" />
                <div className="glass-card p-12 text-center max-w-lg">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6 border border-rose-500/20">
                        <Target size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Target Lost: No Intel Found</h2>
                    <p className="text-slate-400 mb-8">
                        We couldn&apos;t find any performance records for the username <span className="text-white font-bold">@{username}</span>. Verify the uplink and try again.
                    </p>
                    <Link href="/" className="btn-primary inline-flex mx-auto">
                        <ArrowLeft size={18} /> Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 relative">
            <div className="mesh-bg" />

            {/* Navigation */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/" className="inline-flex items-center gap-2 mb-10 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors group">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20">
                        <ArrowLeft size={14} />
                    </div>
                    Back to Unified Dashboard
                </Link>
            </motion.div>

            {/* Profile Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 mb-8 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Code2 size={200} />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl border border-white/20">
                            {profile.name.charAt(0)}
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                                <Activity size={10} /> Operational
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight uppercase">{profile.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <ClickableUsername username={profile.leetcodeUsername} className="text-sm font-bold" />
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                <span className="text-slate-500 font-medium">Rank #{profile.rank || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-8 px-8 py-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Masters</div>
                            <div className="text-3xl font-black text-white tracking-tighter">{profile.currentStats?.total || 0}</div>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="flex items-center">
                            <a
                                href={getLeetCodeProfileURL(profile.leetcodeUsername)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 hover:border-blue-500/30 transition-all group/visit"
                            >
                                <ExternalLink size={14} className="text-blue-400 group-hover/visit:rotate-12 transition-transform" />
                                Visit LeetCode
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="glass-card p-5 group hover:border-white/20"
                        >
                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                {stat.label}
                                <Icon size={14} style={{ color: stat.color }} />
                            </div>
                            <div className="text-2xl font-black tracking-tighter" style={{ color: stat.color }}>{stat.value}</div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Difficulty Intelligence */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 glass-card p-8">
                    <SectionHeader icon={BarChart3} title="Mastery Breakdown" subtitle="Algorithmic difficulty distribution" />
                    <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={diffChart} barGap={12}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                                    {diffChart.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Linguistic Profile */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="glass-card p-8">
                    <SectionHeader icon={PieChartIcon} title="Linguistic Profile" subtitle="Primary development tools" />
                    {languageData.length > 0 ? (
                        <div className="space-y-8 mt-4">
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={languageData}
                                            dataKey="value"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={60}
                                            paddingAngle={4}
                                            stroke="none"
                                        >
                                            {languageData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3">
                                {languageData.map((lang, i) => (
                                    <div key={lang.name} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{lang.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-white">{lang.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10">
                            <Code2 size={40} className="text-slate-700 mb-4" />
                            <p className="text-slate-500 text-sm font-medium">No language signatures detected in current trajectory.</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Persistence Heatmap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card p-8 mb-8">
                <SectionHeader icon={Calendar} title="Operational Persistence" subtitle="Heatmap of strategic submissions (Last 365 Days)" />
                <div className="mt-8">
                    <HeatmapGrid data={profile.heatmapData} />
                </div>
            </motion.div>

            {/* Weekly Trajectory Chart */}
            {profile.weeklyChartData && profile.weeklyChartData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="glass-card p-8 mb-8">
                    <SectionHeader icon={TrendingUp} title="Strategic Trajectory" subtitle="Weekly problem-solving velocity" />
                    <div className="h-64 mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={profile.weeklyChartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fill="url(#colorCount)"
                                    name="Mastered Problems"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Recent Intelligence Logs */}
            {profile.recentSubmissions && profile.recentSubmissions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="glass-card overflow-hidden">
                    <div className="p-8 border-b border-white/5 bg-white/5">
                        <SectionHeader icon={Activity} title="Recent Intelligence Logs" subtitle="Chronological submission history" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Mastery Objective</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Signature</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {profile.recentSubmissions.map((sub, i) => (
                                    <tr key={i} className="table-row-hover group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                    <Code2 size={14} />
                                                </div>
                                                <span className="font-bold text-slate-200 group-hover:text-white transition-colors uppercase text-sm tracking-tight">{sub.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest"
                                                style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                                {sub.language}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    const prompt = generateClaudePrompt(profile, sub);
                                                    navigator.clipboard.writeText(prompt);
                                                    const url = getLeetCodeProfileURL(profile.leetcodeUsername);
                                                    if (url) window.open(url, '_blank');
                                                    alert(`Review Prompt for "${sub.title}" copied to clipboard! Opening LeetCode...`);
                                                }}
                                                className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-all mx-auto"
                                                title="Review with Claude"
                                            >
                                                <Sparkles size={12} />
                                            </button>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                                {new Date(sub.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
