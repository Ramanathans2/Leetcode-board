import cron from 'node-cron';
import { POST as refreshData } from '@/app/api/refresh/route';

let isJobRunning = false;

export function setupCron() {
    if (isJobRunning) {
        console.log('Cron job already configured');
        return;
    }

    console.log('Initializing LeetCode Refresh Cron Job (Every 6 hours)');

    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('Running scheduled LeetCode data refresh...');
        try {
            // We can't directly call the API route as a function easily if it uses NextResponse
            // but we can call the logic if we extract it, or just use fetch to the local API
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/refresh`, { method: 'POST' });
            const data = await response.json();
            console.log('Cron Refresh Success:', data.message);
        } catch (error) {
            console.error('Cron Refresh Error:', error.message);
        }
    });

    isJobRunning = true;
}
