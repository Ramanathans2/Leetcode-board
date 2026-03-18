import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import { setupCron } from '@/lib/cron-job';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    try {
        await connectDB();
        try { setupCron(); } catch (e) { console.warn('Cron setup failed'); }

        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'total';
        const order = searchParams.get('order') || 'desc';

        const sortMap = {
            total: 'currentStats.total',
            easy: 'currentStats.easy',
            medium: 'currentStats.medium',
            hard: 'currentStats.hard',
            today: 'todaySolved',
            weekly: 'weeklySolved',
            impact: 'overallImpactScore',
            momentum: 'momentumScore',
            consistency: 'consistencyScore',
            tier: 'tier',
            streak: 'streak',
            name: 'name',
            lastActive: 'lastSubmissionTime',
        };

        const sortField = sortMap[sortBy] || 'currentStats.total';
        const sortOrder = order === 'asc' ? 1 : -1;

        let students = await Student.find({})
            .sort({ [sortField]: sortOrder })
            .lean();

        // Fallback to JSON if DB is empty
        if (students.length === 0) {
            const jsonPath = path.join(process.cwd(), 'src/data/students.json');
            if (fs.existsSync(jsonPath)) {
                const raw = fs.readFileSync(jsonPath, 'utf8');
                const jsonStudents = JSON.parse(raw);
                students = jsonStudents.map(s => ({
                    ...s,
                    _id: s.leetcodeUsername,
                    currentStats: s.currentStats || { total: 0, easy: 0, medium: 0, hard: 0 },
                    todaySolved: s.todaySolved || 0,
                    streak: s.streak || 0,
                    consistencyScore: s.consistencyScore || 0
                }));
            }
        }

        // Add rank
        const ranked = students.map((s, i) => ({
            ...s,
            rank: i + 1,
        }));

        return NextResponse.json(ranked);
    } catch (error) {
        console.error('Leaderboard API Error:', error.message);

        // Final fallback for complete DB failure
        const jsonPath = path.join(process.cwd(), 'src/data/students.json');
        if (fs.existsSync(jsonPath)) {
            const raw = fs.readFileSync(jsonPath, 'utf8');
            const jsonStudents = JSON.parse(raw);
            const students = jsonStudents.map((s, i) => ({
                ...s,
                _id: s.leetcodeUsername,
                rank: i + 1,
                currentStats: s.currentStats || { total: 0, easy: 0, medium: 0, hard: 0 },
                todaySolved: s.todaySolved || 0,
                streak: s.streak || 0,
                consistencyScore: s.consistencyScore || 0
            }));
            return NextResponse.json(students);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
