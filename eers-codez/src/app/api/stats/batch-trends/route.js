import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailySnapshot from '@/lib/models/DailySnapshot';

export async function GET() {
    try {
        await connectDB();

        // Get the last 30 days of snapshots
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Aggregate snapshots by date
        const trends = await DailySnapshot.aggregate([
            {
                $match: {
                    date: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalDaily: { $sum: "$dailySolved" },
                    totalEasy: { $sum: "$easy" },
                    totalMedium: { $sum: "$medium" },
                    totalHard: { $sum: "$hard" },
                    solvers: {
                        $push: {
                            $cond: [
                                { $gt: ["$dailySolved", 0] },
                                { name: "$leetcodeUsername", count: "$dailySolved" },
                                "$$REMOVE"
                            ]
                        }
                    }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        const formattedTrends = trends.map(t => ({
            date: t._id,
            label: new Date(t._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: t.totalDaily,
            easy: t.totalEasy,
            medium: t.totalMedium,
            hard: t.totalHard,
            solvers: t.solvers || []
        }));

        return NextResponse.json(formattedTrends);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
