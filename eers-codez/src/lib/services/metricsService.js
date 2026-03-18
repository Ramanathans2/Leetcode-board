/**
 * Elite Metrics Service
 * Algorithms for Momentum, Consistency, and Tiers
 */

/**
 * Momentum Algorithm
 * Calculates delta growth/decay comparing current 7-day window vs previous 7-day window.
 */
export function calculateMomentum(snapshots) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const last7Days = snapshots.filter(s => s.date >= sevenDaysAgo);
    const prev7Days = snapshots.filter(s => s.date >= fourteenDaysAgo && s.date < sevenDaysAgo);

    const last7Total = last7Days.reduce((acc, s) => acc + (s.dailySolved || 0), 0);
    const prev7Total = prev7Days.reduce((acc, s) => acc + (s.dailySolved || 0), 0);

    const score = last7Total - prev7Total;

    return {
        score,
        trend: score > 0 ? 'up' : (score < 0 ? 'down' : 'stable')
    };
}

/**
 * Consistency Score
 * formula: (ActiveDays / TotalTrackedDays) * 100
 */
export function calculateConsistency(snapshots) {
    if (!snapshots || snapshots.length === 0) return 0;

    const activeDays = snapshots.filter(s => (s.dailySolved || 0) > 0).length;
    const totalDays = snapshots.length;

    return Math.round((activeDays / totalDays) * 100);
}

/**
 * Tier Classification (Percentile-based)
 * Top 10%: Elite
 * Top 25%: Advanced
 * Top 50%-75%: Developing
 * Below 75%: Inactive
 */
export function classifyTier(rank, totalStudents) {
    const percentile = (rank / totalStudents) * 100;

    if (percentile <= 10) return 'Elite';
    if (percentile <= 25) return 'Advanced';
    if (percentile <= 75) return 'Developing';
    return 'Inactive';
}

/**
 * Contribution %
 */
export function calculateContribution(individualDelta, batchTotal) {
    if (batchTotal === 0) return 0;
    return Number(((individualDelta / batchTotal) * 100).toFixed(1));
}

/**
 * Difficulty Index
 * formula: (Easy*1 + Medium*2 + Hard*3) / TotalSolved
 */
export function calculateDifficultyIndex(stats) {
    const total = stats.total || 0;
    if (total === 0) return 0;
    const score = (stats.easy * 1) + (stats.medium * 2) + (stats.hard * 3);
    return Number((score / total).toFixed(2));
}

/**
 * Volatility Index
 * Calculates the standard deviation of daily solves over the last 14 days.
 */
export function calculateVolatilityIndex(snapshots) {
    if (!snapshots || snapshots.length < 2) return 0;

    // Last 14 days
    const data = snapshots.slice(-14).map(s => s.dailySolved || 0);
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;

    return Number(Math.sqrt(variance).toFixed(2));
}
