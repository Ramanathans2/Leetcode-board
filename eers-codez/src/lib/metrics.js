// Calculate streak from submission calendar
export function calculateStreak(submissionCalendar) {
    if (!submissionCalendar || Object.keys(submissionCalendar).length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    // Check today and go backwards
    for (let i = 0; i < 365; i++) {
        const timestamp = Math.floor(currentDate.getTime() / 1000);
        const dayStr = timestamp.toString();

        // Check if there's activity on this day (LeetCode calendar uses unix timestamps at midnight UTC)
        const startOfDay = new Date(currentDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        let hasActivity = false;
        for (const [ts, count] of Object.entries(submissionCalendar)) {
            const tsNum = parseInt(ts);
            if (tsNum >= Math.floor(startOfDay.getTime() / 1000) &&
                tsNum <= Math.floor(endOfDay.getTime() / 1000) &&
                count > 0) {
                hasActivity = true;
                break;
            }
        }

        if (hasActivity) {
            streak++;
        } else if (i > 0) {
            // Allow skipping today (might not have solved yet)
            break;
        }

        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

// Calculate consistency score (active days / total days tracked)
export function calculateConsistency(submissionCalendar, totalDaysTracked = 30) {
    if (!submissionCalendar || Object.keys(submissionCalendar).length === 0) return 0;

    const now = Date.now() / 1000;
    const startTime = now - (totalDaysTracked * 86400);

    let activeDays = 0;
    for (const [ts, count] of Object.entries(submissionCalendar)) {
        const tsNum = parseInt(ts);
        if (tsNum >= startTime && count > 0) {
            activeDays++;
        }
    }

    return Math.round((activeDays / totalDaysTracked) * 100);
}

// Calculate difficulty index (weighted score)
export function calculateDifficultyIndex(easy, medium, hard) {
    const total = easy + medium + hard;
    if (total === 0) return 0;
    return parseFloat(((easy * 1 + medium * 2 + hard * 3) / total).toFixed(2));
}

// Calculate momentum (compare last 7 days vs previous 7 days)
export function calculateMomentum(submissionCalendar) {
    if (!submissionCalendar || Object.keys(submissionCalendar).length === 0) return 0;

    const now = Date.now() / 1000;
    const sevenDaysAgo = now - (7 * 86400);
    const fourteenDaysAgo = now - (14 * 86400);

    let lastWeek = 0;
    let prevWeek = 0;

    for (const [ts, count] of Object.entries(submissionCalendar)) {
        const tsNum = parseInt(ts);
        if (tsNum >= sevenDaysAgo && count > 0) {
            lastWeek += count;
        } else if (tsNum >= fourteenDaysAgo && tsNum < sevenDaysAgo && count > 0) {
            prevWeek += count;
        }
    }

    if (prevWeek === 0) return lastWeek > 0 ? 100 : 0;
    return Math.round(((lastWeek - prevWeek) / prevWeek) * 100);
}

// Calculate weekly growth percentage
export function calculateWeeklyGrowth(snapshots) {
    if (!snapshots || snapshots.length < 2) return 0;
    const sorted = [...snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted[0]?.totalSolved || 0;
    const weekAgo = sorted[Math.min(6, sorted.length - 1)]?.totalSolved || 0;
    if (weekAgo === 0) return 0;
    return Math.round(((latest - weekAgo) / weekAgo) * 100);
}

// Calculate today's solved count from calendar
export function calculateTodaySolved(submissionCalendar) {
    if (!submissionCalendar || Object.keys(submissionCalendar).length === 0) return 0;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayTs = Math.floor(today.getTime() / 1000);
    const tomorrowTs = todayTs + 86400;

    let todaySolved = 0;
    for (const [ts, count] of Object.entries(submissionCalendar)) {
        const tsNum = parseInt(ts);
        if (tsNum >= todayTs && tsNum < tomorrowTs) {
            todaySolved += count;
        }
    }
    return todaySolved;
}

// Calculate this week's solved count
export function calculateWeeklySolved(submissionCalendar) {
    if (!submissionCalendar || Object.keys(submissionCalendar).length === 0) return 0;

    const now = Date.now() / 1000;
    const weekAgo = now - (7 * 86400);

    let weeklySolved = 0;
    for (const [ts, count] of Object.entries(submissionCalendar)) {
        const tsNum = parseInt(ts);
        if (tsNum >= weekAgo && count > 0) {
            weeklySolved += count;
        }
    }
    return weeklySolved;
}

// Get activity data for heatmap (last 365 days)
export function getHeatmapData(submissionCalendar) {
    if (!submissionCalendar) return [];

    const data = [];
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    for (let i = 364; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setUTCHours(0, 0, 0, 0);
        const ts = Math.floor(date.getTime() / 1000).toString();
        const count = submissionCalendar[ts] || 0;

        data.push({
            date: date.toISOString().split('T')[0],
            count,
            day: date.getDay(),
            week: Math.floor(i / 7),
        });
    }

    return data;
}

// Get weekly data points for chart
export function getWeeklyChartData(submissionCalendar, weeks = 12) {
    if (!submissionCalendar) return [];

    const data = [];
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    for (let w = weeks - 1; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (w * 7) - 6);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (w * 7));

        let count = 0;
        for (const [ts, c] of Object.entries(submissionCalendar)) {
            const tsNum = parseInt(ts);
            const startTs = Math.floor(weekStart.getTime() / 1000);
            const endTs = Math.floor(weekEnd.getTime() / 1000) + 86400;
            if (tsNum >= startTs && tsNum < endTs && c > 0) {
                count += c;
            }
        }

        data.push({
            week: `W${weeks - w}`,
            label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count,
        });
    }

    return data;
}
