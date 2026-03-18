import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import DailySnapshot from '@/lib/models/DailySnapshot';
import DailyHistory from '@/lib/models/DailyHistory';
import { fetchQuestionDifficulty } from '@/lib/leetcode';

const DIFFICULTY_LOOKUP = {
    'powx-n': 'Medium',
    'spiral-matrix': 'Medium',
    'rotate-image': 'Medium',
    'set-matrix-zeroes': 'Medium',
    'add-digits': 'Easy',
    'two-sum': 'Easy',
};

/**
 * EE'rs Codez - Daily Intelligence API
 * Handles Live and Dormant Mode (Historical recovery)
 */
export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const requestedDateStr = searchParams.get('date');

        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        let targetDate = today;
        let isHistorical = false;

        if (requestedDateStr) {
            const parsedDate = new Date(requestedDateStr);
            if (!isNaN(parsedDate.getTime())) {
                targetDate = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
                isHistorical = targetDate.getTime() !== today.getTime();
            }
        }

        const yesterday = new Date(targetDate);
        yesterday.setDate(targetDate.getDate() - 1);

        let lastBatchSubmission = null;

        const students = await Student.find({}).lean();

        // 1. DATE RANGE SEARCH: More robust than exact equality (handles timezone shifts)
        const dayStart = new Date(targetDate);
        const dayEnd = new Date(targetDate);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const yesterdayStart = new Date(yesterday);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() + 1);

        // Fetch snapshots for the target date range
        let snapshotsToday = await DailySnapshot.find({
            date: { $gte: dayStart, $lt: dayEnd }
        }).lean();

        // Fetch historical records for the target date
        const targetDateStr = targetDate.toISOString().split('T')[0];
        const historicalRecords = await DailyHistory.find({ date: targetDateStr }).lean();

        // Fetch snapshots for yesterday for delta comparison
        const snapshotsYesterday = await DailySnapshot.find({
            date: { $gte: yesterdayStart, $lt: yesterdayEnd }
        }).lean();

        const totalYesterday = snapshotsYesterday.reduce((sum, s) => sum + (s.dailySolved || 0), 0);

        let clusterTotal = historicalRecords.reduce((sum, h) => sum + (h.totalSolved || 0), 0);
        let clusterImpact = historicalRecords.reduce((sum, h) => sum + (h.impactScore || 0), 0);
        let clusterEasy = historicalRecords.reduce((sum, h) => sum + (h.easySolved || 0), 0);
        let clusterMedium = historicalRecords.reduce((sum, h) => sum + (h.mediumSolved || 0), 0);
        let clusterHard = historicalRecords.reduce((sum, h) => sum + (h.hardSolved || 0), 0);

        // Fallback to snapshots if historical records are missing (for legacy data)
        if (clusterTotal === 0) {
            clusterTotal = snapshotsToday.reduce((sum, s) => sum + (s.dailySolved || 0), 0);
            clusterImpact = snapshotsToday.reduce((sum, s) => sum + (s.impactScore || 0), 0);
            clusterEasy = snapshotsToday.reduce((sum, s) => sum + (s.easyDelta || 0), 0);
            clusterMedium = snapshotsToday.reduce((sum, s) => sum + (s.mediumDelta || 0), 0);
            clusterHard = snapshotsToday.reduce((sum, s) => sum + (s.hardDelta || 0), 0);
        }

        let isDormant = clusterTotal === 0 && !isHistorical; // In history, we try to reconstruct
        let activeSnapDate = targetDate;

        // 2. ACTIVITY RECONSTRUCTION (Activity Feed fallback for history)
        const activityMap = new Map();
        const targetTimestampStart = Math.floor(targetDate.getTime() / 1000);
        const targetTimestampEnd = targetTimestampStart + 86400;
        students.forEach(s => {
            if (s.recentSubmissions && Array.isArray(s.recentSubmissions)) {
                s.recentSubmissions.forEach(sub => {
                    const subTime = sub.timestamp;
                    if (subTime >= targetTimestampStart && subTime < targetTimestampEnd) {
                        const existing = activityMap.get(s.name);
                        if (!existing || sub.timestamp > existing.timestamp) {
                            activityMap.set(s.name, {
                                studentName: s.name,
                                title: sub.title,
                                timestamp: sub.timestamp,
                                difficulty: sub.difficulty
                            });
                        }
                    }
                });
            }
        });
        const activityFeed = Array.from(activityMap.values());

        // 3. ARCHIVAL RECONSTRUCTION (Fallback if snapshots missing)
        if (clusterTotal === 0 && isHistorical) {
            students.forEach(s => {
                if (s.submissionCalendar) {
                    try {
                        const calendar = typeof s.submissionCalendar === 'string'
                            ? JSON.parse(s.submissionCalendar)
                            : s.submissionCalendar;
                        Object.entries(calendar).forEach(([ts, count]) => {
                            const timestamp = parseInt(ts);
                            if (timestamp >= targetTimestampStart && timestamp < targetTimestampEnd) {
                                clusterTotal += count;
                            }
                        });
                    } catch (e) { }
                }
            });
            if (clusterTotal > 0) isDormant = false;
        }

        // Live Mode DORMANT logic
        if (isDormant && !isHistorical) {
            const lastActiveSnap = await DailySnapshot.findOne({ dailySolved: { $gt: 0 } }).sort({ date: -1 }).lean();
            if (lastActiveSnap) {
                activeSnapDate = lastActiveSnap.date;
                snapshotsToday = await DailySnapshot.find({
                    date: {
                        $gte: new Date(activeSnapDate),
                        $lt: new Date(new Date(activeSnapDate).setUTCDate(new Date(activeSnapDate).getUTCDate() + 1))
                    }
                }).lean();
            }
        }

        // Snapshots are already aggregated using reduce earlier.

        const dailyData = await Promise.all(students.map(async s => {
            const hRecord = historicalRecords.find(h => h.studentId.toString() === s._id.toString());
            const snap = snapshotsToday.find(sn => sn.studentId.toString() === s._id.toString());

            let reconEasy = hRecord?.easySolved ?? snap?.easyDelta ?? 0;
            let reconMedium = hRecord?.mediumSolved ?? snap?.mediumDelta ?? 0;
            let reconHard = hRecord?.hardSolved ?? snap?.hardDelta ?? 0;
            let reconstructedSolved = hRecord?.totalSolved ?? snap?.dailySolved ?? 0;
            const solvedProblems = [];

            // Reconstruct breakdown and problem list from recentSubmissions
            if (s.recentSubmissions && Array.isArray(s.recentSubmissions)) {
                const dayProblems = s.recentSubmissions.filter(sub => {
                    const subTime = sub.timestamp;
                    return subTime >= targetTimestampStart && subTime < targetTimestampEnd;
                });

                // Process problems with difficulty recovery
                await Promise.all(dayProblems.map(async (sub) => {
                    let diff = sub.difficulty;

                    // Recovery 1: Local Fallback Map
                    if (!diff && sub.titleSlug && DIFFICULTY_LOOKUP[sub.titleSlug]) {
                        diff = DIFFICULTY_LOOKUP[sub.titleSlug];
                    }

                    // Recovery 2: Real-time Fetch (Only if missing and not in map)
                    if (!diff && sub.titleSlug) {
                        diff = await fetchQuestionDifficulty(sub.titleSlug);
                        if (diff === 'Unknown') diff = 'Easy'; // Final fallback
                    }

                    if (!diff) diff = 'Easy';

                    solvedProblems.push({
                        title: sub.title,
                        difficulty: diff,
                        timestamp: sub.timestamp
                    });
                }));

                // Always prioritize reconstruction from recentSubmissions for count consistency
                if (solvedProblems.length > 0) {
                    reconEasy = solvedProblems.filter(p => p.difficulty?.toLowerCase() === 'easy').length;
                    reconMedium = solvedProblems.filter(p => p.difficulty?.toLowerCase() === 'medium').length;
                    reconHard = solvedProblems.filter(p => p.difficulty?.toLowerCase() === 'hard').length;
                    reconstructedSolved = solvedProblems.length;

                    // Update cluster totals for historical or missing snaps
                    if (isHistorical || (clusterTotal === 0 && !isDormant)) {
                        clusterEasy = (clusterEasy || 0) + reconEasy;
                        clusterMedium = (clusterMedium || 0) + reconMedium;
                        clusterHard = (clusterHard || 0) + reconHard;
                        clusterTotal = (clusterTotal || 0) + reconstructedSolved;
                        clusterImpact = (clusterImpact || 0) + (reconEasy * 1 + reconMedium * 2 + reconHard * 3);
                    }
                }
            }

            // Fallback for total count if still missing or if calendar shows more activity (Archival Reconstruction)
            if (isHistorical && reconstructedSolved === 0 && s.submissionCalendar) {
                try {
                    const calendar = typeof s.submissionCalendar === 'string'
                        ? JSON.parse(s.submissionCalendar)
                        : s.submissionCalendar;
                    let calendarCount = 0;
                    Object.entries(calendar).forEach(([ts, count]) => {
                        const timestamp = parseInt(ts);
                        if (timestamp >= targetTimestampStart && timestamp < targetTimestampEnd) {
                            calendarCount += count;
                        }
                    });
                    if (calendarCount > 0) {
                        reconstructedSolved = calendarCount;
                        reconEasy = calendarCount; // Default to Easy for archival counts without breakdown

                        // Create placeholder entries to keep UI consistent
                        for (let i = 0; i < calendarCount; i++) {
                            solvedProblems.push({
                                title: "Archival Record (Details Unavailable)",
                                difficulty: "Easy",
                                timestamp: targetTimestampStart
                            });
                        }

                        if (isHistorical) {
                            clusterTotal += calendarCount;
                            clusterEasy += calendarCount;
                            clusterImpact += (calendarCount * 1);
                        }
                    }
                } catch (e) { }
            }

            return {
                name: s.name,
                leetcodeUsername: s.leetcodeUsername,
                todaySolved: reconstructedSolved,
                total: snap?.totalSolved || s.currentStats?.total || 0,
                impactScore: snap?.impactScore || (reconEasy * 1 + reconMedium * 2 + reconHard * 3) || (reconstructedSolved * 2),
                easy: reconEasy,
                medium: reconMedium,
                hard: reconHard,
                lastSubmission: s.lastSubmissionTime,
                solvedProblems: solvedProblems.sort((a, b) => b.timestamp - a.timestamp)
            };
        }));

        dailyData.sort((a, b) => b.todaySolved - a.todaySolved || b.impactScore - a.impactScore);

        const diffPercent = totalYesterday > 0 ? Math.round(((clusterTotal - totalYesterday) / totalYesterday) * 100) : 100;

        // Daily Insights
        const insights = [];
        if (isDormant) {
            insights.push({
                type: 'info',
                text: isHistorical
                    ? `Archival Silence. No activity recorded on ${requestedDateStr || targetDate.toISOString().split('T')[0]}.`
                    : `System Idle. Showing last active performance from ${new Date(activeSnapDate).toDateString()}.`
            });
        } else if (clusterTotal > 0 && snapshotsToday.length === 0 && isHistorical) {
            insights.push({
                type: 'info',
                text: `Archival Reconstruction: Visualizing direct LeetCode pulse for ${requestedDateStr || targetDate.toISOString().split('T')[0]}.`
            });
        }

        const topContributor = dailyData[0];
        if (topContributor && (topContributor.todaySolved > 0 || isDormant)) {
            insights.push({
                type: 'mvp',
                text: `${topContributor.name} ${isDormant ? 'was' : 'is'} leading with an impact score of ${topContributor.impactScore}.`
            });
        }

        return NextResponse.json({
            students: dailyData,
            totalToday: clusterTotal,
            totalYesterday,
            diffPercent,
            impactScore: clusterImpact || (clusterTotal * 2),
            active: isDormant ? 0 : dailyData.filter(s => (s.todaySolved || 0) > 0).length,
            inactive: dailyData.filter(s => (s.todaySolved || 0) === 0).length,
            topSolver: dailyData[0] || null,
            totalStudents: dailyData.length,
            isDormant,
            activeSnapDate,
            breakdown: {
                easy: clusterEasy,
                medium: clusterMedium,
                hard: clusterHard,
                total: clusterEasy + clusterMedium + clusterHard || clusterTotal
            },
            insights,
            activityFeed: activityFeed.sort((a, b) => b.timestamp - a.timestamp),
            latestSubmissionTime: activityFeed.length > 0 ? new Date(activityFeed[0].timestamp * 1000).toISOString() : null,
            latestSubmissionStudent: activityFeed.length > 0 ? activityFeed[0].studentName : null,
            goal: {
                target: 20,
                current: clusterTotal,
                percent: Math.min(Math.round((clusterTotal / 20) * 100), 100)
            }
        });
    } catch (error) {
        console.error("Daily API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
