import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SnapshotService } from '@/lib/services/snapshotService';

/**
 * PERIOD RESET HANDLER
 * Triggered at 00:00 Daily and Sunday.
 */
export async function GET(req) {
    try {
        await connectDB();

        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const isSunday = now.getUTCDay() === 0;

        // Create the baseline snapshot for the new day
        const results = await SnapshotService.createResetSnapshot(todayUTC, isSunday);

        return NextResponse.json({
            success: true,
            date: todayUTC.toISOString(),
            isWeeklyReset: isSunday,
            results
        });

    } catch (error) {
        console.error("[Reset] Error during period reset:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
