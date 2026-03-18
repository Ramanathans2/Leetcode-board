import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import { fetchAllDataForUser } from '@/lib/leetcode';
import {
    calculateStreak,
    calculateConsistency,
    calculateDifficultyIndex,
    calculateMomentum,
    calculateTodaySolved,
    calculateWeeklySolved,
} from '@/lib/metrics';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function POST() {
    try {
        await connectDB();

        const filePath = path.join(process.cwd(), 'src/data/students.xlsx');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Excel file not found at src/data/students.xlsx' }, { status: 404 });
        }

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet);

        let seeded = 0;
        let skipped = 0;
        let errors = 0;
        const errorDetails = [];
        const seededRecords = [];

        for (const row of rawData) {
            // Flexible column mapping
            const name = row['__EMPTY_2'] || row['Name'] || row['Student Name'];
            const registerNumber = row['__EMPTY_1'] || row['Reg No'] || row['Register Number'];
            let leetcodeUsername = row['__EMPTY_4'] || row['LeetCode'] || row['Username'];

            // Skip header or empty usernames
            if (!leetcodeUsername || typeof leetcodeUsername !== 'string' || leetcodeUsername.toLowerCase().includes('user name')) {
                skipped++;
                continue;
            }

            if (!name || typeof name !== 'string' || name.toLowerCase().includes('student name')) {
                skipped++;
                continue;
            }

            // Cleanup username (handle links like leetcode.com/username)
            if (leetcodeUsername.includes('/')) {
                leetcodeUsername = leetcodeUsername.split('/').filter(p => p && p !== 'leetcode.com').pop().trim();
            } else {
                leetcodeUsername = leetcodeUsername.toString().trim();
            }

            const existing = await Student.findOne({ leetcodeUsername });
            if (existing) {
                skipped++;
                continue;
            }

            console.log(`Seeding student: ${name} (@${leetcodeUsername})`);

            try {
                // Fetch LeetCode data
                const lcData = await fetchAllDataForUser(leetcodeUsername);

                const studentDoc = {
                    name: name.trim(),
                    leetcodeUsername: leetcodeUsername.toLowerCase(),
                    registerNumber: registerNumber ? registerNumber.toString() : '',
                    batch: 'EE-2025', // Default batch
                    currentStats: lcData ? {
                        total: lcData.total,
                        easy: lcData.easy,
                        medium: lcData.medium,
                        hard: lcData.hard,
                    } : { total: 0, easy: 0, medium: 0, hard: 0 },
                    mostUsedLanguage: lcData?.mostUsedLanguage || 'N/A',
                    streak: lcData ? calculateStreak(lcData.submissionCalendar) : 0,
                    consistencyScore: lcData ? calculateConsistency(lcData.submissionCalendar) : 0,
                    difficultyIndex: lcData ? calculateDifficultyIndex(lcData.easy, lcData.medium, lcData.hard) : 0,
                    momentumScore: lcData ? calculateMomentum(lcData.submissionCalendar) : 0,
                    todaySolved: lcData ? calculateTodaySolved(lcData.submissionCalendar) : 0,
                    weeklySolved: lcData ? calculateWeeklySolved(lcData.submissionCalendar) : 0,
                    recentSubmissions: lcData?.recentSubmissions || [],
                    submissionCalendar: lcData?.submissionCalendar || {},
                    languageBreakdown: lcData?.languageBreakdown || {},
                    lastUpdated: new Date(),
                };

                // Try to save to DB, but don't fail if DB is down
                try {
                    await Student.findOneAndUpdate(
                        { leetcodeUsername: studentDoc.leetcodeUsername },
                        studentDoc,
                        { upsert: true, new: true }
                    );
                } catch (dbErr) {
                    console.warn(`DB sync failed for ${leetcodeUsername}, using file cache only.`);
                }

                // Push to seeded array for JSON sync
                seededRecords.push(studentDoc);
                seeded++;
            } catch (err) {
                console.error(`Error seeding ${leetcodeUsername}:`, err.message);
                errors++;
                errorDetails.push(`@${leetcodeUsername}: ${err.message}`);
            }
        }

        // Sync to JSON file as cache
        if (seededRecords.length > 0) {
            const jsonPath = path.join(process.cwd(), 'src/data/students.json');
            fs.writeFileSync(jsonPath, JSON.stringify(seededRecords, null, 2));
        }

        return NextResponse.json({
            success: true,
            message: `Ingestion Status: ${seeded} records synchronized, ${skipped} skipped, ${errors} non-critical anomalies.`,
            errorDetails: errors > 0 ? errorDetails : undefined
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: `System Malfunction: ${error.message}` }, { status: 500 });
    }
}
