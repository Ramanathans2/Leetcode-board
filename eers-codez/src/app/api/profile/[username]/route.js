import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';
import DailySnapshot from '@/lib/models/DailySnapshot';
import { getHeatmapData, getWeeklyChartData } from '@/lib/metrics';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { username } = await params;
        const student = await Student.findOne({ leetcodeUsername: username }).lean();

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get snapshots for charts
        const snapshots = await DailySnapshot.find({ leetcodeUsername: username })
            .sort({ date: -1 })
            .limit(30)
            .lean();

        // Build heatmap data
        const heatmapData = getHeatmapData(student.submissionCalendar);
        const weeklyChartData = getWeeklyChartData(student.submissionCalendar);

        return NextResponse.json({
            ...student,
            heatmapData,
            weeklyChartData,
            snapshots,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
