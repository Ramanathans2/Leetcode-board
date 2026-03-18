'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Activity, Flame, Trophy, Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import ExpandableRow from '@/components/Leaderboard/ExpandableRow';
import TierBadge from '@/components/Leaderboard/TierBadge';
import MomentumIndicator from '@/components/Leaderboard/MomentumIndicator';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useSyncRefresh } from '@/hooks/useSync';
import ClickableUsername from '@/components/UI/ClickableUsername';
import SmartSearch from '@/components/Leaderboard/SmartSearch';
import { parseSearchQuery, filterStudents, highlightMatch } from '@/lib/utils/searchParser';

export default function LeaderboardPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('impact');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?sortBy=${sortBy}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  useSyncRefresh(() => fetchLeaderboard());

  const stats = useMemo(() => {
    if (!students.length) return { total: 0, active: 0, avgImpact: 0, streak: 0 };
    const active = students.filter(s => s.todaySolved > 0).length;
    const total = students.reduce((acc, s) => acc + (s.currentStats?.total || 0), 0);
    const avgImpact = Math.round(students.reduce((acc, s) => acc + (s.overallImpactScore || 0), 0) / students.length);
    const maxStreak = Math.max(...students.map(s => s.streak || 0));
    return { total, active, avgImpact, streak: maxStreak, studentCount: students.length };
  }, [students]);

  const batchWeeklyTotal = useMemo(() => {
    return students.reduce((acc, s) => acc + (s.weeklySolved || 0), 0);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const parsed = parseSearchQuery(searchQuery);
    return filterStudents(students, parsed);
  }, [students, searchQuery]);

  const toggleExpand = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleSort = (key) => {
    setSortBy(key);
  };

  if (loading && !students.length) {
    return <DashboardSkeleton />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-amber-500" size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Live Department Standings</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
            The <span className="neon-blue">Elite</span> Roster
          </h1>
        </div>

        <div className="w-full md:w-96 lg:w-[450px]">
          <SmartSearch 
            value={searchQuery} 
            onChange={setSearchQuery} 
            onClear={() => setSearchQuery('')} 
          />
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Solved" value={<AnimatedCounter value={stats.total} />} icon={<Zap size={20} />} color="blue" delay={0} />
        <StatsCard title="Students strength" value={<AnimatedCounter value={stats.studentCount} />} icon={<Activity size={20} />} color="green" delay={0} />
        <StatsCard title="Avg Impact" value={<AnimatedCounter value={stats.avgImpact} />} icon={<Target size={20} />} color="purple" delay={0} />
        <StatsCard title="Max Streak" value={<AnimatedCounter value={stats.streak} />} icon={<Flame size={20} />} color="red" delay={0} />
      </motion.div>

      {/* Leaderboard Table */}
      <motion.div
        variants={itemVariants}
        className="glass-card overflow-hidden border-white/5"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                <th className="p-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Operative</th>
                <th className="p-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Tier</th>
                <th className="p-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('total')}>
                  <motion.div whileHover={{ scale: 1.05, color: '#fff' }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center gap-2 transition-colors">
                    Problem Solved <ArrowUpDown size={10} />
                  </motion.div>
                </th>
                <th className="p-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Solved</th>
                <th className="p-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Momentum</th>
                <th className="p-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('impact')}>
                  <motion.div whileHover={{ scale: 1.05, color: '#fff' }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center gap-2 transition-colors">
                    Impact Score <ArrowUpDown size={10} />
                  </motion.div>
                </th>
                <th className="p-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => handleSort('lastActive')}>
                  <motion.div whileHover={{ scale: 1.05, color: '#fff' }} whileTap={{ scale: 0.95 }} className="flex items-center justify-center gap-2 transition-colors">
                    Last Active <ArrowUpDown size={10} />
                  </motion.div>
                </th>
                <th className="p-5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                const getRelativeTime = (date) => {
                  if (!date) return 'No activity recorded';
                  const now = new Date();
                  const diffMs = now - new Date(date);
                  const diffSec = Math.floor(diffMs / 1000);
                  const diffMin = Math.floor(diffSec / 60);
                  const diffHrs = Math.floor(diffMin / 60);
                  const diffDays = Math.floor(diffHrs / 24);

                  if (diffSec < 60) return 'Just now';
                  if (diffMin < 60) return `${diffMin}m ago`;
                  if (diffHrs < 24) return `${diffHrs}h ago`;
                  if (diffDays === 1) return 'Yesterday';
                  if (diffDays < 7) return `${diffDays}d ago`;
                  return '7+ days ago';
                };

                const getStatusColor = (date) => {
                  if (!date) return 'bg-slate-500';
                  const now = new Date();
                  const diffDays = (now - new Date(date)) / (1000 * 60 * 60 * 24);
                  if (diffDays < 1) return 'bg-emerald-500';
                  if (diffDays < 3) return 'bg-amber-500';
                  return 'bg-rose-500';
                };

                const isExpanded = expandedIds.has(student._id);
                return (
                  <React.Fragment key={student._id}>
                    <tr
                      onClick={() => toggleExpand(student._id)}
                      className={`group cursor-pointer border-b border-white/5 transition-all duration-300 hover:bg-white/[0.03] ${isExpanded ? 'bg-blue-500/5' : ''}`}
                    >
                      <td className="p-5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                          idx === 1 ? 'bg-slate-300 text-black shadow-[0_0_15px_rgba(203,213,225,0.5)]' :
                            idx === 2 ? 'bg-orange-700 text-white shadow-[0_0_15px_rgba(194,65,12,0.5)]' :
                              'bg-white/5 text-slate-400'
                          }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="p-5">
                        <div>
                          <div className="font-black text-sm text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors whitespace-nowrap">
                            {highlightMatch(student.name, searchQuery)}
                          </div>
                          <ClickableUsername username={student.leetcodeUsername} className="text-[10px]">
                            {highlightMatch(student.leetcodeUsername, searchQuery)}
                          </ClickableUsername>
                        </div>
                      </td>
                      <td className="p-5">
                        <TierBadge tier={student.tier} />
                      </td>
                      <td className="p-5 text-center">
                        <div className="text-xl font-black text-blue-400 tracking-tighter uppercase whitespace-nowrap">
                          {student.currentStats?.total || 0}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-black text-emerald-500">{student.currentStats?.easy || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-[10px] font-black text-blue-500">{student.currentStats?.medium || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span className="text-[10px] font-black text-rose-500">{student.currentStats?.hard || 0}</span>
                            </div>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(student.currentStats?.total || 0) / (students[0]?.currentStats?.total || 1) * 100}%` }}
                              className="h-full bg-blue-500/50"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center">
                          <MomentumIndicator trend={student.momentumScore > 0 ? 'up' : student.momentumScore < 0 ? 'down' : 'stable'} />
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="text-xl font-black text-blue-400 tracking-tighter uppercase whitespace-nowrap">
                          {student.overallImpactScore}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(student.lastSubmissionTime)} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                          <span className="text-[10px] font-black text-white uppercase tracking-tight whitespace-nowrap opacity-80">
                            {getRelativeTime(student.lastSubmissionTime)}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : 'text-slate-600'}`}>
                          <ChevronDown size={16} />
                        </div>
                      </td>
                    </tr>
                    <ExpandableRow student={student} batchWeeklyTotal={batchWeeklyTotal} isExpanded={isExpanded} colSpan={9} />
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan="9" className="p-24 text-center">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="p-6 rounded-full bg-white/5 border border-white/10 text-slate-700">
                        <Search size={48} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-white">No Matching Operatives Found</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Try searching by name, tier, or use commands like <span className="text-blue-500">tier:elite</span></p>
                      </div>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                      >
                        Reset All Filters
                      </button>
                    </motion.div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="h-3 w-40 skeleton" />
          <div className="h-10 w-64 skeleton" />
        </div>
        <div className="h-12 w-96 skeleton rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 skeleton rounded-2xl border border-white/5" />
        ))}
      </div>
      <div className="skeleton h-[500px] rounded-2xl border border-white/5 overflow-hidden">
        <div className="h-16 bg-white/5 w-full border-b border-white/5" />
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-white/5 rounded w-full border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
