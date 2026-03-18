import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { POST as syncNow } from '../sync-now/route';
import { POST as refreshData } from '../refresh/route';

/**
 * Vercel Cron Job Endpoint
 * Security: Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('--- Vercel Cron: Starting Scheduled Sync ---');
        await connectDB();

        // 1. Refresh Data (LeetCode Fetch)
        const refreshResponse = await refreshData();
        const refreshResult = await refreshResponse.json();
        console.log('Cron Stage 1 (Refresh):', refreshResult.message || refreshResult.error);

        // 2. Intelligence Sync (Metrics/Tiers)
        const syncResponse = await syncNow();
        const syncResult = await syncResponse.json();
        console.log('Cron Stage 2 (Sync):', syncResult.success ? 'Success' : syncResult.error);

        return NextResponse.json({
            success: true,
            message: 'Vercel Cron Job executed successfully',
            refresh: refreshResult,
            sync: syncResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Vercel Cron Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
