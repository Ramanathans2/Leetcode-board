import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import DailySnapshot from '@/lib/models/DailySnapshot';

export async function GET() {
    try {
        await connectDB();

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setUTCHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setUTCHours(23, 59, 59, 999);

        // Previous Week Range for Growth Calculation
        const prevStart = new Date(startOfWeek);
        prevStart.setDate(startOfWeek.getDate() - 7);
        const prevEnd = new Date(prevStart);
        prevEnd.setDate(prevStart.getDate() + 6);
        prevEnd.setUTCHours(23, 59, 59, 999);

        // Fetch snapshots for current week
        const currentSnapshots = await DailySnapshot.find({
            date: { $gte: startOfWeek, $lte: endOfWeek }
        }).sort({ date: 1 }).lean();

        // Fetch snapshots for previous week
        const prevSnapshots = await DailySnapshot.find({
            date: { $gte: prevStart, $lte: prevEnd }
        }).lean();

        const students = await Student.find({}).lean();
        const studentMap = {};
        students.forEach(s => {
            studentMap[s._id.toString()] = {
                name: s.name,
                username: s.leetcodeUsername,
                total: s.currentStats?.total || 0,
                weeklySolved: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                impactScore: 0,
                languages: {},
                trend: Array(7).fill(0) // Sun to Sat
            };
        });

        // Current Week Aggregation
        currentSnapshots.forEach(snap => {
            const sid = snap.studentId.toString();
            if (studentMap[sid]) {
                const s = studentMap[sid];
                s.weeklySolved += (snap.dailySolved || 0);
                s.easy += (snap.easyDelta || 0);
                s.medium += (snap.mediumDelta || 0);
                s.hard += (snap.hardDelta || 0);
                s.impactScore += (snap.impactScore || 0);

                // Aggregate languages
                if (snap.languageBreakdown) {
                    Object.entries(snap.languageBreakdown).forEach(([lang, count]) => {
                        s.languages[lang] = (s.languages[lang] || 0) + count;
                    });
                }

                // Trend data index (0-6 based on Sunday)
                const dayIdx = new Date(snap.date).getDay();
                s.trend[dayIdx] += (snap.dailySolved || 0);
            }
        });

        // Totals & Distribution
        let totalThisWeek = Object.values(studentMap).reduce((acc, s) => acc + s.weeklySolved, 0);
        let isDormant = totalThisWeek === 0;
        let activeRange = { start: startOfWeek, end: endOfWeek };

        if (isDormant) {
            // Find the most recent snapshot with dailySolved > 0
            const lastActiveSnap = await DailySnapshot.findOne({ dailySolved: { $gt: 0 } }).sort({ date: -1 }).lean();
            if (lastActiveSnap) {
                const lastDate = lastActiveSnap.date;
                const lastStart = new Date(lastDate);
                lastStart.setDate(lastDate.getDate() - lastDate.getDay());
                lastStart.setUTCHours(0, 0, 0, 0);
                const lastEnd = new Date(lastStart);
                lastEnd.setDate(lastStart.getDate() + 6);
                lastEnd.setUTCHours(23, 59, 59, 999);

                activeRange = { start: lastStart, end: lastEnd };

                // Refetch snapshots for that active week to populate the dashboard
                const activeSnapshots = await DailySnapshot.find({
                    date: { $gte: lastStart, $lte: lastEnd }
                }).sort({ date: 1 }).lean();

                // Reset student map for the active week
                Object.values(studentMap).forEach(s => {
                    s.weeklySolved = 0; s.easy = 0; s.medium = 0; s.hard = 0; s.impactScore = 0;
                    s.trend = Array(7).fill(0);
                });

                activeSnapshots.forEach(snap => {
                    const sid = snap.studentId.toString();
                    if (studentMap[sid]) {
                        const s = studentMap[sid];
                        s.weeklySolved += (snap.dailySolved || 0);
                        s.easy += (snap.easyDelta || 0);
                        s.medium += (snap.mediumDelta || 0);
                        s.hard += (snap.hardDelta || 0);
                        s.impactScore += (snap.impactScore || 0);
                        s.trend[new Date(snap.date).getDay()] += (snap.dailySolved || 0);
                    }
                });
                totalThisWeek = Object.values(studentMap).reduce((acc, s) => acc + s.weeklySolved, 0);
            }
        }

        let totalLastWeek = 0;
        const globalLanguages = {};
        const dailyBatchTrend = Array(7).fill(0);
        const breakdown = { easy: 0, medium: 0, hard: 0 };

        Object.values(studentMap).forEach(s => {
            breakdown.easy += s.easy;
            breakdown.medium += s.medium;
            breakdown.hard += s.hard;
            s.trend.forEach((val, i) => dailyBatchTrend[i] += val);
            Object.entries(s.languages).forEach(([l, c]) => {
                globalLanguages[l] = (globalLanguages[l] || 0) + c;
            });
        });

        // Prev Week Totals (for real growth comparison)
        prevSnapshots.forEach(snap => {
            totalLastWeek += (snap.dailySolved || 0);
        });

        const weeklyGrowth = totalLastWeek === 0 ? 100 : Math.round(((totalThisWeek - totalLastWeek) / totalLastWeek) * 100);

        // Leaderboard & MVP
        const sortedStudents = Object.values(studentMap).sort((a, b) => {
            if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
            if (b.weeklySolved !== a.weeklySolved) return b.weeklySolved - a.weeklySolved;
            return a.name.localeCompare(b.name);
        });

        const topSolver = sortedStudents[0]?.impactScore > 0 || (isDormant && sortedStudents[0]?.weeklySolved > 0) ? sortedStudents[0] : null;

        // Language Leaders
        const langLeaders = {};
        ['Java', 'Python', 'C++', 'JavaScript'].forEach(lang => {
            const leader = Object.values(studentMap)
                .map(s => ({ name: s.name, count: s.languages[lang] || 0 }))
                .filter(s => s.count > 0)
                .sort((a, b) => b.count - a.count)[0];
            langLeaders[lang] = leader || null;
        });

        // Micro-Insights
        const insights = [];
        if (isDormant) {
            insights.push({ type: 'info', text: `Showing previous active performance from week of ${activeRange.start.toDateString()}.` });
        } else {
            if (totalThisWeek > totalLastWeek && totalLastWeek > 0) {
                insights.push({ type: 'growth', text: `Batch velocity is up ${weeklyGrowth}% compared to last week!` });
            }
            if (breakdown.hard > breakdown.medium) {
                insights.push({ type: 'difficulty', text: "High Difficulty specialization detected: Hard problems solved exceeds Medium." });
            }
        }

        if (topSolver) {
            insights.push({ type: 'performance', text: `${topSolver.name} ${isDormant ? 'was' : 'is'} the Weekly Champion.` });
        }

        return NextResponse.json({
            range: activeRange,
            totalWeekly: totalThisWeek,
            growth: weeklyGrowth,
            impactScore: Object.values(studentMap).reduce((acc, s) => acc + s.impactScore, 0),
            active: sortedStudents.filter(s => s.weeklySolved > 0).length,
            inactive: sortedStudents.filter(s => s.weeklySolved === 0).length,
            totalStudents: sortedStudents.length,
            topSolver,
            students: sortedStudents,
            breakdown,
            trend: dailyBatchTrend,
            languages: {
                distribution: Object.entries(globalLanguages).map(([name, value]) => ({ name, value })),
                leaders: langLeaders
            },
            insights,
            isDormant
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
