import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import DailySnapshot from '@/lib/models/DailySnapshot';
import { fetchAllDataForUser } from '@/lib/leetcode';
import path from 'path';
import {
    calculateStreak,
    calculateConsistency,
    calculateDifficultyIndex,
    calculateMomentum,
    calculateTodaySolved,
    calculateWeeklySolved,
} from '@/lib/metrics';

export async function POST() {
    try {
        await connectDB();
        let students = await Student.find({});

        // Cold start: if DB empty, load from students.json
        if (students.length === 0) {
            const jsonPath = path.join(process.cwd(), 'src/data/students.json');
            if (fs.existsSync(jsonPath)) {
                const raw = fs.readFileSync(jsonPath, 'utf8');
                const jsonStudents = JSON.parse(raw);
                // Create placeholders so we have IDs to update
                for (const s of jsonStudents) {
                    await Student.findOneAndUpdate(
                        { leetcodeUsername: s.leetcodeUsername },
                        s,
                        { upsert: true, new: true }
                    );
                }
                students = await Student.find({});
            }
        }

        let updated = 0;
        let errors = 0;

        // Process in batches of 5 to stay within rate limits but gain parallel speed
        const batchSize = 5;
        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);
            await Promise.all(batch.map(async (student) => {
                try {
                    const lcData = await fetchAllDataForUser(student.leetcodeUsername);
                    if (!lcData) {
                        errors++;
                        return;
                    }

                    const now = new Date();
                    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

                    student.currentStats = {
                        total: lcData.total,
                        easy: lcData.easy,
                        medium: lcData.medium,
                        hard: lcData.hard,
                    };
                    student.mostUsedLanguage = lcData.mostUsedLanguage;
                    student.streak = calculateStreak(lcData.submissionCalendar);
                    student.consistencyScore = calculateConsistency(lcData.submissionCalendar);
                    student.difficultyIndex = calculateDifficultyIndex(lcData.easy, lcData.medium, lcData.hard);
                    student.momentumScore = calculateMomentum(lcData.submissionCalendar);
                    student.todaySolved = calculateTodaySolved(lcData.submissionCalendar);
                    student.weeklySolved = calculateWeeklySolved(lcData.submissionCalendar);
                    student.recentSubmissions = lcData.recentSubmissions;
                    student.submissionCalendar = lcData.submissionCalendar;
                    student.languageBreakdown = lcData.languageBreakdown;
                    student.lastUpdated = new Date();

                    // Update lastSubmissionTime from recentSubmissions
                    if (lcData.recentSubmissions && lcData.recentSubmissions.length > 0) {
                        const latest = lcData.recentSubmissions[0].timestamp;
                        student.lastSubmissionTime = new Date(latest * 1000);
                    }

                    await student.save();

                    // Calculate daily difficulty deltas
                    const pastSnapshot = await DailySnapshot.findOne({
                        studentId: student._id,
                        date: { $lt: today }
                    }).sort({ date: -1 }).lean();

                    let easyDelta = 0;
                    let mediumDelta = 0;
                    let hardDelta = 0;

                    if (pastSnapshot) {
                        easyDelta = Math.max(0, lcData.easy - (pastSnapshot.easy || 0));
                        mediumDelta = Math.max(0, lcData.medium - (pastSnapshot.medium || 0));
                        hardDelta = Math.max(0, lcData.hard - (pastSnapshot.hard || 0));
                    } else {
                        if (lcData.total === student.todaySolved) {
                            easyDelta = lcData.easy;
                            mediumDelta = lcData.medium;
                            hardDelta = lcData.hard;
                        }
                    }

                    // Calculate Impact Score: (Easy * 1) + (Medium * 2) + (Hard * 3)
                    const impactScore = (easyDelta * 1) + (mediumDelta * 2) + (hardDelta * 3);

                    // Save daily snapshot
                    await DailySnapshot.findOneAndUpdate(
                        { studentId: student._id, date: today },
                        {
                            studentId: student._id,
                            leetcodeUsername: student.leetcodeUsername,
                            date: today,
                            totalSolved: lcData.total,
                            easy: lcData.easy,
                            medium: lcData.medium,
                            hard: lcData.hard,
                            easyDelta,
                            mediumDelta,
                            hardDelta,
                            impactScore,
                            dailySolved: student.todaySolved,
                            weeklySolved: student.weeklySolved,
                            languageBreakdown: lcData.languageBreakdown,
                        },
                        { upsert: true, new: true }
                    );

                    updated++;
                } catch (err) {
                    console.error(`Error updating ${student.leetcodeUsername}:`, err.message);
                    errors++;
                }
            }));
        }

        // Sync to students.json for fallback consistency (DISABLED ON VERCEL)
        if (!process.env.VERCEL) {
            try {
                const allStudents = await Student.find({}).lean();
                const jsonPath = path.join(process.cwd(), 'src/data/students.json');
                fs.writeFileSync(jsonPath, JSON.stringify(allStudents, null, 2));
            } catch (e) {
                console.error('Failed to sync JSON cache:', e.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updated} students, ${errors} errors`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
