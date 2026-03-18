import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Activity, Target, Zap, Clock, Code2, PieChart, Sparkles, Copy, ExternalLink, ChevronRight } from 'lucide-react';
import InfoTooltip from '@/components/UI/InfoTooltip';
import { generateClaudePrompt } from '@/lib/promptUtils';
import { getLeetCodeProfileURL } from '@/lib/urlUtils';

const CircularProgress = ({ value, color, label, subValue1, subLabel1, subValue2, subLabel2, tooltip }) => {
    const numericValue = Math.min(Math.max(Number(value) || 0, 0), 100);
    const size = 110;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (numericValue / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/20 border border-white/5 group/donut relative">
            <div className="relative w-[110px] h-[110px] flex items-center justify-center transition-transform duration-500 group-hover/donut:scale-110">
                <svg className="w-full h-full -rotate-90">
                    <circle className="text-white/5" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
                    <motion.circle 
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        strokeWidth={strokeWidth} 
                        strokeDasharray={circumference} 
                        strokeLinecap="round" 
                        stroke={color} 
                        fill="transparent" 
                        r={radius} 
                        cx={size / 2} 
                        cy={size / 2} 
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black text-white tracking-tighter">{Math.round(numericValue)}%</span>
                </div>
            </div>
            
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4 mb-2">{label}</span>
            
            <div className="flex w-full justify-between mt-2 pt-2 border-t border-white/5">
                <div className="flex flex-col items-baseline">
                    <span className="text-[9px] font-bold text-slate-600 uppercase">{subLabel1}</span>
                    <span className="text-xs font-black text-white">{subValue1}</span>
                </div>
                <div className="flex flex-col items-end items-baseline">
                    <span className="text-[9px] font-bold text-slate-600 uppercase">{subLabel2}</span>
                    <span className="text-xs font-black text-white">{subValue2}</span>
                </div>
            </div>

            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/donut:opacity-100 transition-opacity bg-blue-600 text-white text-[9px] font-black px-3 py-1.5 rounded pointer-events-none whitespace-nowrap z-50 shadow-xl">
                {tooltip}
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded shadow-2xl border border-white/20">
                {payload[0].value} Solved
            </div>
        );
    }
    return null;
};

export default function ExpandableRow({ student, batchWeeklyTotal, isExpanded, colSpan = 9 }) {
    const weekly = Number(student?.weeklySolved) || 0;
    const total = Number(batchWeeklyTotal) || 0;
    const contribution = total > 0 ? ((weekly / total) * 100).toFixed(1) : 0;

    // Discrete 14-day history (Daily counts)
    const historyData = useMemo(() => {
        try {
            const calendar = typeof student.submissionCalendar === 'string' 
                ? JSON.parse(student.submissionCalendar) 
                : (student.submissionCalendar || {});
            
            const results = [];
            const now = new Date();
            for (let i = 13; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const start = Math.floor(new Date(d.setUTCHours(0,0,0,0)).getTime() / 1000);
                const end = start + 86400;
                
                let daySolved = 0;
                Object.entries(calendar).forEach(([ts, count]) => {
                    const timestamp = parseInt(ts);
                    if (timestamp >= start && timestamp < end) daySolved += count;
                });
                results.push({ val: daySolved });
            }
            return results;
        } catch (e) {
            console.error("Error calculating daily growth:", e);
            return Array(14).fill({ val: 0 });
        }
    }, [student.submissionCalendar]);

    const growthMetrics = useMemo(() => {
        if (!historyData || historyData.length === 0) return { start: 0, current: 0, growth: 0 };
        const start = historyData[0].val;
        const current = historyData[historyData.length - 1].val;
        return { start, current, growth: current - start };
    }, [historyData]);

    const stats = student.currentStats || { easy: 0, medium: 0, hard: 0, total: 0 };
    const isInactive = stats.total === 0;

    return (
        <AnimatePresence>
            {isExpanded && (
                <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="bg-blue-500/5 overflow-hidden"
                >
                    <td colSpan={colSpan} className="p-0 overflow-hidden">
                        <div className="p-8 space-y-8 border-x border-white/5 max-w-[1400px] mx-auto">
                            
                            {/* ROW 1: PERFORMANCE GROWTH */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="glass-card p-8 border-white/5 bg-white/5 relative overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${isInactive ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Growth Intelligence</h3>
                                            <p className="text-xl font-black text-white italic tracking-tighter uppercase">14-Day Growth Curve</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Start Count</span>
                                            <span className="text-lg font-black text-white">{growthMetrics.start}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Current Count</span>
                                            <span className="text-lg font-black text-white">{growthMetrics.current}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Growth</span>
                                            <span className={`text-lg font-black ${growthMetrics.growth > 0 ? 'text-emerald-500' : isInactive ? 'text-slate-700' : 'text-rose-500'}`}>
                                                {growthMetrics.growth > 0 ? '+' : ''}{growthMetrics.growth}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="h-48 w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historyData}>
                                            <defs>
                                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={isInactive ? "#EF4444" : "#3B82F6"} stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor={isInactive ? "#EF4444" : "#3B82F6"} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <Line 
                                                type="monotone" 
                                                dataKey="val" 
                                                stroke={isInactive ? "#EF4444" : "#3B82F6"} 
                                                strokeWidth={4} 
                                                dot={{ r: 4, fill: isInactive ? '#EF4444' : '#3B82F6', strokeWidth: 2, stroke: '#1E293B' }} 
                                                activeDot={{ r: 8, fill: isInactive ? '#F87171' : '#60A5FA', strokeWidth: 0, shadow: `0 0 20px ${isInactive ? 'rgba(239,68,68,0.8)' : 'rgba(96,165,250,0.8)'}` }}
                                                animationDuration={800}
                                                animationBegin={200}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#60A5FA', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-700">
                                    <span className="uppercase tracking-[0.3em]">Cycle Start</span>
                                    <span className="uppercase tracking-[0.3em]">Peak Performance Field</span>
                                </div>
                            </motion.div>

                            {/* ROW 2: SKILL PROFILE */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                >
                                    <CircularProgress 
                                        value={student.consistencyScore} 
                                        color="#10B981" 
                                        label="Consistency"
                                        subValue1={Math.round((student.consistencyScore / 100) * 14)}
                                        subLabel1="Active Days"
                                        subValue2={14 - Math.round((student.consistencyScore / 100) * 14)}
                                        subLabel2="Inactive Days"
                                        tooltip="Practice frequency across 14-day window"
                                    />
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <CircularProgress 
                                        value={contribution} 
                                        color="#3B82F6" 
                                        label="Contribution"
                                        subValue1={weekly}
                                        subLabel1="Student Solved"
                                        subValue2={total}
                                        subLabel2="Class Total"
                                        tooltip="Percentage of total class problems solved"
                                    />
                                </motion.div>
                                
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.45 }}
                                    className="glass-card p-6 border-white/5 bg-white/5"
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                                            <PieChart size={18} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Difficulty Distribution</span>
                                    </div>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Easy', count: stats.easy, color: '#10B981', bg: 'bg-emerald-500' },
                                            { label: 'Medium', count: stats.medium, color: '#3B82F6', bg: 'bg-blue-500' },
                                            { label: 'Hard', count: stats.hard, color: '#EF4444', bg: 'bg-rose-500' }
                                        ].map((item, i) => (
                                            <div key={item.label} className="group/bar relative">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${item.bg}`} />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter opacity-80">{item.label}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400">{item.count}</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }} 
                                                        animate={{ width: `${(item.count / (stats.total || 1)) * 100}%` }} 
                                                        transition={{ duration: 1.2, delay: 0.6 + (i * 0.1) }}
                                                        style={{ backgroundColor: item.color }}
                                                        className="h-full shadow-[0_0_10px_rgba(0,0,0,0.3)] group-hover/bar:brightness-125 transition-all" 
                                                    />
                                                </div>
                                                <div className="absolute -top-10 right-0 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white/10 backdrop-blur rounded px-2 py-1 text-[9px] font-black text-white border border-white/5">
                                                    {Math.round((item.count / (stats.total || 1)) * 100)}% Focus
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* ROW 3: LANGUAGE & SUBMISSIONS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* LANGUAGE BREAKDOWN */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55 }}
                                    className="glass-card p-8 border-white/5 bg-white/5"
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                                            <Code2 size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Language Breakdown</span>
                                    </div>
                                    <div className="space-y-5">
                                        {Object.entries(student.languageBreakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([lang, count], i) => (
                                            <div key={lang} className="group/lang relative">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-white uppercase tracking-tighter">{lang}</span>
                                                    <span className="text-[10px] font-black text-slate-500">{count} Problems</span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }} 
                                                        animate={{ width: `${(count / student.currentStats.total) * 100}%` }} 
                                                        transition={{ duration: 1, delay: 0.7 + (i * 0.1) }}
                                                        className="h-full bg-orange-500/50 group-hover/lang:bg-orange-400 transition-colors" 
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {(!student.languageBreakdown || Object.keys(student.languageBreakdown).length === 0) && (
                                            <div className="py-8 text-center text-[10px] font-bold text-slate-700 uppercase italic border border-dashed border-white/5 rounded-2xl">
                                                No language sync data available
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* RECENT SUBMISSIONS */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.65 }}
                                    className="glass-card p-8 border-white/5 bg-white/5"
                                >
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                                            <Sparkles size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Submissions</span>
                                    </div>
                                    <div className="space-y-4">
                                        {student.recentSubmissions?.slice(0, 5).map((sub, idx) => (
                                            <motion.div 
                                                key={idx} 
                                                whileHover={{ y: -4, scale: 1.01 }}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5 hover:border-blue-500/30 group/sub transition-all cursor-pointer shadow-lg"
                                                onClick={() => {
                                                    const prompt = generateClaudePrompt(student, sub);
                                                    navigator.clipboard.writeText(prompt);
                                                    const url = getLeetCodeProfileURL(student.leetcodeUsername);
                                                    if (url) window.open(url, '_blank');
                                                    alert(`Review Prompt for "${sub.title}" copied! Opening LeetCode Profile...`);
                                                }}
                                            >
                                                <div className="flex gap-4 items-center overflow-hidden">
                                                    <div className="flex flex-col items-center justify-center min-w-[40px] h-10 bg-white/5 rounded-xl border border-white/5">
                                                        <span className="text-[9px] font-black text-slate-500 uppercase">{new Date(sub.timestamp * 1000).toLocaleDateString([], { month: 'short' })}</span>
                                                        <span className="text-sm font-black text-white">{new Date(sub.timestamp * 1000).getUTCDate()}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                                        <span className="text-sm font-black text-white truncate pr-2 group-hover/sub:text-blue-400 transition-colors" title={sub.title}>
                                                            {sub.title}
                                                        </span>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-[9px] text-blue-400/80 uppercase font-black tracking-widest">{sub.language}</span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                            <span className={`text-[9px] font-black px-1.5 rounded uppercase ${
                                                                sub.difficulty?.toLowerCase() === 'easy' ? 'text-emerald-500 bg-emerald-500/10' :
                                                                sub.difficulty?.toLowerCase() === 'medium' ? 'text-blue-500 bg-blue-500/10' :
                                                                'text-rose-500 bg-rose-500/10'
                                                            }`}>
                                                                {sub.difficulty || 'Easy'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-700 group-hover/sub:text-blue-400 group-hover/sub:translate-x-1 transition-all" />
                                            </motion.div>
                                        ))}
                                        {(!student.recentSubmissions || student.recentSubmissions.length === 0) && (
                                            <div className="py-20 text-center text-[10px] font-bold text-slate-700 uppercase italic border border-dashed border-white/5 rounded-3xl">
                                                Inertia: No recent activity synchronized
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </td>
                </motion.tr>
            )}
        </AnimatePresence>
    );
}
