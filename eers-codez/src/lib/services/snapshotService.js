import DailySnapshot from '../models/DailySnapshot';
import Student from '../models/Student';

/**
 * Snapshot Service
 * Responsible for creating and managing period baseline snapshots.
 */
export const SnapshotService = {
    /**
     * Create a reset snapshot for all students.
     * @param {Date} date - The date for the snapshot (Midnight UTC)
     * @param {Boolean} isWeekly - Whether this is a weekly reset
     */
    async createResetSnapshot(date, isWeekly = false) {
        console.log(`[Snapshot] Starting reset snapshot for ${date.toISOString()} (Weekly: ${isWeekly})`);
        const students = await Student.find({});
        const results = { success: 0, failed: 0 };

        for (const student of students) {
            try {
                const stats = student.currentStats || { total: 0, easy: 0, medium: 0, hard: 0 };

                await DailySnapshot.findOneAndUpdate(
                    { studentId: student._id, date },
                    {
                        studentId: student._id,
                        leetcodeUsername: student.leetcodeUsername,
                        date,
                        totalSolved: stats.total,
                        easy: stats.easy,
                        medium: stats.medium,
                        hard: stats.hard,
                        dailySolved: 0,
                        weeklySolved: isWeekly ? 0 : student.weeklySolved,
                        easyDelta: 0,
                        mediumDelta: 0,
                        hardDelta: 0,
                        impactScore: 0
                    },
                    { upsert: true, new: true }
                );
                results.success++;
            } catch (err) {
                console.error(`[Snapshot] Failed for ${student.leetcodeUsername}:`, err.message);
                results.failed++;
            }
        }

        console.log(`[Snapshot] Reset complete. Success: ${results.success}, Failed: ${results.failed}`);
        return results;
    },

    /**
     * Get the baseline snapshot for a period.
     * Daily: Last snapshot before target date.
     * Weekly: Last snapshot on or before Sunday.
     */
    async getBaseline(studentId, targetDate, isWeekly = false) {
        let queryDate = new Date(targetDate);

        if (isWeekly) {
            // Find the most recent Sunday baseline
            queryDate.setDate(targetDate.getUTCDate() - targetDate.getUTCDay());
        } else {
            // Find the snapshot from exactly midnight of the target date (which holds the start totals)
        }

        const baseline = await DailySnapshot.findOne({
            studentId,
            date: isWeekly ? { $lte: queryDate } : targetDate
        }).sort({ date: -1 }).lean();

        return baseline;
    }
};
