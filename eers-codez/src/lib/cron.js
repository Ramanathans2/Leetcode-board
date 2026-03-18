const cron = require('node-cron');
const fetch = require('node-node-fetch'); // or use native fetch if Node 18+

/**
 * EE'rs Codez Automated Intelligence Sync
 * Frequency: Every 30 minutes
 */
const startIntelligenceSync = () => {
    console.log('🚀 EE\'rs Codez: Synchronization Engine Started');

    // Schedule refresh every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        console.log('🕒 Triggering Scheduled Intelligence Sync...');
        try {
            const response = await fetch('http://localhost:3000/api/sync-now', {
                method: 'POST'
            });
            const result = await response.json();
            console.log('✅ Scheduled Sync Complete:', result);
        } catch (error) {
            console.error('❌ Scheduled Sync Failed:', error.message);
        }
    });

    // Scheduled midnight cleanup/init if needed
    cron.schedule('0 0 * * *', () => {
        console.log('🕛 Midnight Cycle Reset: Starting fresh intelligence cycle.');
    });
};

module.exports = { startIntelligenceSync };
