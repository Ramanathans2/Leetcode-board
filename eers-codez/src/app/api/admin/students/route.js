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

// POST: Register a new student
export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { name, leetcodeUsername, registerNumber, batch } = body;

        if (!name || !leetcodeUsername) {
            return NextResponse.json({ error: 'Name and LeetCode username are required' }, { status: 400 });
        }

        const existing = await Student.findOne({ leetcodeUsername });
        if (existing) {
            return NextResponse.json({ error: 'Student already registered in the intelligence grid' }, { status: 400 });
        }

        // Fetch LeetCode data for the new student
        const lcData = await fetchAllDataForUser(leetcodeUsername);

        const studentDoc = {
            name: name.trim(),
            leetcodeUsername: leetcodeUsername.trim(),
            registerNumber: registerNumber || '',
            batch: batch || '',
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

        const student = await Student.create(studentDoc);
        return NextResponse.json(student, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Neutralize a student
export async function DELETE(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username required' }, { status: 400 });
        }

        const result = await Student.deleteOne({ leetcodeUsername: username });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Target not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Target neutralized' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
