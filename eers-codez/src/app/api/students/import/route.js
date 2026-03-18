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

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { name, leetcodeUsername } = body;

        if (!name || !leetcodeUsername) {
            return NextResponse.json({ error: 'Name and LeetCode username are required' }, { status: 400 });
        }

        // 1. Check if already exists
        const existing = await Student.findOne({ 
            leetcodeUsername: { $regex: new RegExp(`^${leetcodeUsername.trim()}$`, 'i') } 
        });
        
        if (existing) {
            return NextResponse.json({ error: 'student details are already existed' }, { status: 400 });
        }

        // 2. Validate LeetCode profile
        const lcData = await fetchAllDataForUser(leetcodeUsername.trim());
        if (!lcData) {
            return NextResponse.json({ error: 'invalid username' }, { status: 404 });
        }

        // 3. Create student document
        const studentDoc = {
            name: name.trim(),
            leetcodeUsername: leetcodeUsername.trim(),
            currentStats: {
                total: lcData.total,
                easy: lcData.easy,
                medium: lcData.medium,
                hard: lcData.hard,
            },
            mostUsedLanguage: lcData.mostUsedLanguage || 'N/A',
            streak: calculateStreak(lcData.submissionCalendar),
            consistencyScore: calculateConsistency(lcData.submissionCalendar),
            difficultyIndex: calculateDifficultyIndex(lcData.easy, lcData.medium, lcData.hard),
            momentumScore: calculateMomentum(lcData.submissionCalendar),
            todaySolved: calculateTodaySolved(lcData.submissionCalendar),
            weeklySolved: calculateWeeklySolved(lcData.submissionCalendar),
            recentSubmissions: lcData.recentSubmissions || [],
            submissionCalendar: lcData.submissionCalendar || {},
            languageBreakdown: lcData.languageBreakdown || {},
            lastUpdated: new Date(),
        };

        const student = await Student.create(studentDoc);
        return NextResponse.json({ 
            success: true, 
            message: 'Student imported successfully',
            student 
        }, { status: 201 });

    } catch (error) {
        console.error('[Import API Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
