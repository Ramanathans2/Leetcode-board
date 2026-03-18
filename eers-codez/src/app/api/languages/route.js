import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';

export async function GET() {
    try {
        await connectDB();
        const students = await Student.find({}).lean();

        // Aggregate language data across all students
        const languageTotals = {};
        const languageByStudent = {};

        students.forEach(s => {
            if (s.languageBreakdown) {
                for (const [lang, count] of Object.entries(s.languageBreakdown)) {
                    languageTotals[lang] = (languageTotals[lang] || 0) + count;

                    if (!languageByStudent[lang]) languageByStudent[lang] = [];
                    languageByStudent[lang].push({
                        name: s.name,
                        leetcodeUsername: s.leetcodeUsername,
                        count,
                    });
                }
            }
        });

        // Sort language totals
        const sortedLanguages = Object.entries(languageTotals)
            .map(([language, total]) => ({ language, total }))
            .sort((a, b) => b.total - a.total);

        // Sort students within each language
        for (const lang of Object.keys(languageByStudent)) {
            languageByStudent[lang].sort((a, b) => b.count - a.count);
        }

        // Per-student language data
        const studentLanguages = students.map(s => ({
            name: s.name,
            leetcodeUsername: s.leetcodeUsername,
            mostUsedLanguage: s.mostUsedLanguage || 'N/A',
            languageBreakdown: s.languageBreakdown || {},
        }));

        return NextResponse.json({
            languageTotals: sortedLanguages,
            languageByStudent,
            studentLanguages,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
