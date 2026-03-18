import { fetchQuestionDifficulty } from '../leetcode';

/**
 * Submission Parser Service
 * Handles de-duplication, difficulty lookup, and date-based aggregation.
 */
export async function parseRecentSubmissions(submissions, targetDateStr) {
    const easySet = new Set();
    const mediumSet = new Set();
    const hardSet = new Set();

    // Process each submission
    for (const sub of submissions) {
        // Convert timestamp to YYYY-MM-DD (UTC)
        const subDate = new Date(sub.timestamp * 1000).toISOString().split('T')[0];

        // Filter for target date
        if (subDate === targetDateStr) {
            const titleSlug = sub.titleSlug;

            // Avoid duplicates: check if already counted
            if (easySet.has(titleSlug) || mediumSet.has(titleSlug) || hardSet.has(titleSlug)) {
                continue;
            }

            // Resolve difficulty
            const difficulty = await fetchQuestionDifficulty(titleSlug);

            if (difficulty === 'Easy') easySet.add(titleSlug);
            else if (difficulty === 'Medium') mediumSet.add(titleSlug);
            else if (difficulty === 'Hard') hardSet.add(titleSlug);
        }
    }

    const easySolved = easySet.size;
    const mediumSolved = mediumSet.size;
    const hardSolved = hardSet.size;

    return {
        easySolved,
        mediumSolved,
        hardSolved,
        totalSolved: easySolved + mediumSolved + hardSolved,
        impactScore: (easySolved * 1) + (mediumSolved * 2) + (hardSolved * 3)
    };
}
