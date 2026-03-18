/**
 * Metric Intelligence Definitions
 * Centralized logic and explanations for dashboard transparency.
 */

export const METRIC_DEFINITIONS = {
    IMPACT_SCORE: {
        title: "Impact Score",
        formula: "Impact = (Easy × 1) + (Medium × 2) + (Hard × 3)",
        description: "A weighted performance metric that rewards problem complexity. Unlike raw solve counts, the Impact Score reflects the actual intellectual effort exerted.",
        algorithm: "Every problem solved is assigned a weight based on difficulty: Easy (1pt), Medium (2pts), and Hard (3pts). The sum determines the total impact.",
        example: (data) => {
            const e = data?.easy || 2;
            const m = data?.medium || 1;
            const h = data?.hard || 1;
            const score = (e * 1) + (m * 2) + (h * 3);
            return `If you solve ${e} Easy, ${m} Medium, and ${h} Hard problems, your score is (${e}×1) + (${m}×2) + (${h}×3) = ${score}.`;
        }
    },
    MOMENTUM: {
        title: "Momentum Score",
        formula: "Momentum = Last7Days - Previous7Days",
        description: "Measures the rate of change in your solving activity. Positive momentum indicates you are outperforming your previous week's baseline.",
        algorithm: "Calculates the total solves in the last 7 days and subtracts the total from the 7 days prior. >0 is Improving, <0 is Declining.",
        example: (data) => {
            const l7 = data?.last7 || 15;
            const p7 = data?.prev7 || 10;
            const score = l7 - p7;
            return `Last 7 Days (${l7}) - Previous 7 Days (${p7}) = ${score > 0 ? '+' : ''}${score} Momentum.`;
        }
    },
    CONSISTENCY: {
        title: "Consistency %",
        formula: "Consistency = (ActiveDays / TotalTracked) × 100",
        description: "Measures discipline and regularity. High consistency is often more valuable than sudden bursts of high-volume activity.",
        algorithm: "A day is considered 'Active' if at least one submission is solved. This percentage reflects your presence in the trenches.",
        example: (data) => {
            const active = data?.active || 5;
            const total = data?.total || 7;
            const perc = ((active / total) * 100).toFixed(0);
            return `Active on ${active} out of ${total} monitored days = ${perc}%.`;
        }
    },
    CONTRIBUTION: {
        title: "Contribution %",
        formula: "Contribution = (UserWeekly / BatchWeekly) × 100",
        description: "Your relative impact within the current batch. Shows how much of the class total intelligence is driven by your efforts.",
        algorithm: "Calculates the ratio of your weekly solves against the entire batch's weekly output.",
        example: (data) => {
            const user = data?.user || 10;
            const batch = data?.batch || 100;
            const perc = ((user / batch) * 100).toFixed(1);
            return `User (${user}) / Batch (${batch}) = ${perc}% of class output.`;
        }
    },
    DIFFICULTY_INDEX: {
        title: "Difficulty Index",
        formula: "Index = ImpactScore / TotalSolved",
        description: "Measures the average complexity of your solved problems. A higher index indicates a preference for Medium and Hard challenges.",
        algorithm: "Normalizes your impact against your volume. 1.0 means all Easy, 3.0 means all Hard.",
        example: (data) => {
            const impact = data?.impact || 15;
            const total = data?.total || 10;
            const index = (impact / total).toFixed(2);
            return `Impact (${impact}) / Total (${total}) = ${index} Difficulty Index.`;
        }
    },
    VOLATILITY: {
        title: "Volatility Index",
        formula: "Volatility = σ(Last 14 Daily Solves)",
        description: "Measures the stability of your daily output. Low volatility indicates a steady, predictable working rhythm.",
        algorithm: "Calculates the standard deviation of your daily solved counts over a 14-day window.",
        example: (data) => {
            const sd = data?.sd || 1.5;
            return `A standard deviation of ${sd} suggests your daily solve volume typically deviates by ±${sd} from your mean.`;
        }
    },
    TIER_RANKING: {
        title: "Tier Classification",
        formula: "Percentile = (Rank / Total) × 100",
        description: "Dynamic ranking based on weekly solve volume relative to your peers.",
        algorithm: "Elite (Top 10%), Advanced (Top 25%), Developing (50-75%), Inactive (Bottom 25%).",
        example: (data) => {
            const rank = data?.rank || 2;
            const total = data?.total || 20;
            const perc = ((rank / total) * 100).toFixed(0);
            return `Rank #${rank} in a class of ${total} places you in the ${perc}th percentile.`;
        }
    }
};
