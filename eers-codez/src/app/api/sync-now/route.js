import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import DailySnapshot from '@/lib/models/DailySnapshot';
import SyncLog from '@/lib/models/SyncLog';
import DailyHistory from '@/lib/models/DailyHistory';
import { fetchEliteLeetCodeData } from '@/lib/services/leetcodeService';
import { parseRecentSubmissions } from '@/lib/services/submissionParser';
import { calculateDeltas, calculateImpactScore } from '@/lib/services/deltaService';
import { calculateMomentum, calculateConsistency, classifyTier, calculateDifficultyIndex, calculateVolatilityIndex } from '@/lib/services/metricsService';
import path from 'path';
import fs from 'fs';

let isSyncing = false;

export async function POST() {
    if (isSyncing) return NextResponse.json({ error: 'Sync already in progress' }, { status: 429 });

    const startTime = Date.now();
    isSyncing = true;

    try {
        await connectDB();
        const students = await Student.find({});
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        // Explicit Week Baseline (Last Sunday)
        const sunday = new Date(todayUTC);
        sunday.setDate(todayUTC.getDate() - todayUTC.getDay());

        let syncedCount = 0;
        let failedCount = 0;

        // Step 1: Individual Sync
        const batchSize = 5;
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);
            await Promise.all(batch.map(async (student) => {
                try {
                    // FETCH: Robust retrieval with isolation and retry
                    const lcData = await fetchEliteLeetCodeData(student.leetcodeUsername);

                    // BASELINES: Find the snapshots that mark the start of the current periods
                    const dayStartSnap = await DailySnapshot.findOne({
                        studentId: student._id,
                        date: todayUTC // The snapshot created at 00:00 today holds the start totals
                    }).lean();

                    const weekStartSnap = await DailySnapshot.findOne({
                        studentId: student._id,
                        date: { $lte: sunday }
                    }).sort({ date: -1 }).lean();

                    // FALLBACK: If a reset was missed, use the oldest available snapshot < today as baseline
                    const safeDayStart = dayStartSnap || await DailySnapshot.findOne({
                        studentId: student._id,
                        date: { $lt: todayUTC }
                    }).sort({ date: -1 }).lean();

                    // DELTAS: Calculate actual performance since period start
                    const daily = calculateDeltas(lcData, safeDayStart);
                    const weekly = calculateDeltas(lcData, weekStartSnap);

                    const dailyImpact = calculateImpactScore(daily);

                    // METRICS: 14-Day context
                    const history = await DailySnapshot.find({
                        studentId: student._id,
                        date: { $gte: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) }
                    }).sort({ date: 1 }).lean();

                    const momentum = calculateMomentum(history);
                    const consistency = calculateConsistency(history);

                    // PERSIST: Update Student Profile
                    student.currentStats = {
                        total: lcData.total,
                        easy: lcData.easy,
                        medium: lcData.medium,
                        hard: lcData.hard
                    };
                    student.overallImpactScore = (lcData.easy * 1) + (lcData.medium * 2) + (lcData.hard * 3);
                    student.momentumScore = momentum.score;
                    student.momentumTrend = momentum.trend;
                    student.consistencyScore = consistency;
                    student.difficultyIndex = calculateDifficultyIndex(student.currentStats);
                    student.volatilityIndex = calculateVolatilityIndex(history);

                    student.todaySolved = daily.total;
                    student.weeklySolved = weekly.total;

                    student.submissionCalendar = lcData.submissionCalendar;
                    student.languageBreakdown = lcData.languageBreakdown;
                    student.recentSubmissions = lcData.recentSubmissions;
                    student.mostUsedLanguage = lcData.mostUsedLanguage;

                    if (lcData.recentSubmissions?.[0]) {
                        student.lastSubmissionTime = new Date(lcData.recentSubmissions[0].timestamp * 1000);
                    }
                    student.lastUpdated = now;

                    await student.save();

                    // Step 1.5: Detailed Daily History (New Requirement)
                    const dateStr = todayUTC.toISOString().split('T')[0];
                    const dailyBreakdown = await parseRecentSubmissions(lcData.recentSubmissions, dateStr);

                    await DailyHistory.findOneAndUpdate(
                        { studentId: student._id, date: dateStr },
                        {
                            studentId: student._id,
                            date: dateStr,
                            easySolved: dailyBreakdown.easySolved,
                            mediumSolved: dailyBreakdown.mediumSolved,
                            hardSolved: dailyBreakdown.hardSolved,
                            totalSolved: dailyBreakdown.totalSolved,
                            impactScore: dailyBreakdown.impactScore
                        },
                        { upsert: true }
                    );

                    // UPDATE SNAPSHOT: Reflect the current day's progress (keeping for backward compatibility)
                    await DailySnapshot.findOneAndUpdate(
                        { studentId: student._id, date: todayUTC },
                        {
                            studentId: student._id,
                            leetcodeUsername: student.leetcodeUsername,
                            date: todayUTC,
                            // Totals
                            totalSolved: lcData.total,
                            easy: lcData.easy,
                            medium: lcData.medium,
                            hard: lcData.hard,
                            // Deltas
                            easyDelta: dailyBreakdown.easySolved,
                            mediumDelta: dailyBreakdown.mediumSolved,
                            hardDelta: dailyBreakdown.hardSolved,
                            dailySolved: dailyBreakdown.totalSolved,
                            weeklySolved: weekly.total,
                            impactScore: dailyBreakdown.impactScore,
                            languageBreakdown: lcData.languageBreakdown
                        },
                        { upsert: true }
                    );

                    syncedCount++;
                } catch (err) {
                    console.error(`[Sync] Critical failure for ${student.leetcodeUsername}:`, err.message);
                    failedCount++;
                }
            }));
        }

        // Step 2: Global Tier Classification
        const allStudents = await Student.find({}).sort({ weeklySolved: -1, overallImpactScore: -1 });
        const totalCount = allStudents.length;
        for (let i = 0; i < totalCount; i++) {
            const s = allStudents[i];
            s.tier = classifyTier(i + 1, totalCount);
            await s.save();
        }

        // Persistent Cache Sync
        try {
            const finalBatch = await Student.find({}).lean();
            const jsonPath = path.join(process.cwd(), 'src/data/students.json');
            fs.writeFileSync(jsonPath, JSON.stringify(finalBatch, null, 2));
        } catch (e) { }

        const durationMs = Date.now() - startTime;
        await SyncLog.create({
            status: failedCount === 0 ? 'success' : (syncedCount > 0 ? 'partial' : 'failure'),
            durationMs,
            syncedStudents: syncedCount,
            failedStudents: failedCount,
            type: 'manual'
        });

        isSyncing = false;
        return NextResponse.json({
            success: true,
            syncedStudents: syncedCount,
            failedStudents: failedCount,
            lastSyncTime: now.toISOString()
        });

    } catch (error) {
        isSyncing = false;
        await SyncLog.create({ status: 'failure', error: error.message, type: 'manual' });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
