const LEETCODE_API = 'https://leetcode.com/graphql';

/**
 * Robust User Profile Query
 * Fetches solved totals, ranking, and submission calendar.
 */
const PROFILE_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    submissionCalendar
    profile {
      ranking
      reputation
    }
  }
}
`;

/**
 * Language Problem Count Query
 */
const LANGUAGE_QUERY = `
query languageStats($username: String!) {
  matchedUser(username: $username) {
    languageProblemCount {
      languageName
      problemsSolved
    }
  }
}
`;

/**
 * Recent AC Submissions Query
 */
const SUBMISSIONS_QUERY = `
query getRecentSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
`;

/**
 * Question Detail Query for Difficulty Lookup
 */
const QUESTION_DETAIL_QUERY = `
query getQuestionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    difficulty
  }
}
`;

async function leetcodeRequest(query, variables) {
  const response = await fetch(LEETCODE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode API responded with ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL Error');
  }

  return data.data;
}

export async function fetchAllDataForUser(username) {
  if (!username) return null;

  try {
    // Run all queries with improved validation
    const [profileData, languageData, submissionData] = await Promise.all([
      leetcodeRequest(PROFILE_QUERY, { username }),
      leetcodeRequest(LANGUAGE_QUERY, { username }),
      leetcodeRequest(SUBMISSIONS_QUERY, { username, limit: 15 })
    ]);

    const user = profileData?.matchedUser;
    if (!user) return null;

    // 1. Process Difficulty Stats
    const stats = {};
    user.submitStatsGlobal?.acSubmissionNum?.forEach(item => {
      stats[item.difficulty.toLowerCase()] = Number(item.count) || 0;
    });

    // 2. Process Submission Calendar
    let submissionCalendar = {};
    try {
      submissionCalendar = JSON.parse(user.submissionCalendar || '{}');
    } catch (e) {
      console.error(`[LeetCode] Calendar parse error for ${username}`);
    }

    // 3. Process Language Stats
    const languageBreakdown = {};
    let mostUsedLanguage = 'N/A';
    let maxSolved = 0;

    languageData?.matchedUser?.languageProblemCount?.forEach(lang => {
      const count = Number(lang.problemsSolved) || 0;
      languageBreakdown[lang.languageName] = count;
      if (count > maxSolved) {
        maxSolved = count;
        mostUsedLanguage = lang.languageName;
      }
    });

    // 4. Process Recent Submissions with Difficulty Lookup
    const recentSubmissions = await Promise.all((submissionData?.recentAcSubmissionList || []).map(async (s) => {
      const difficulty = await fetchQuestionDifficulty(s.titleSlug);
      return {
        title: s.title,
        titleSlug: s.titleSlug,
        language: s.lang,
        timestamp: parseInt(s.timestamp),
        status: s.statusDisplay,
        difficulty: difficulty // Now including difficulty
      };
    }));

    // Final Validation: Ensure core totals are valid numbers
    if (typeof stats.all !== 'number' || isNaN(stats.all)) {
      throw new Error(`Invalid stats received for ${username}`);
    }

    return {
      username: user.username,
      total: stats.all || 0,
      easy: stats.easy || 0,
      medium: stats.medium || 0,
      hard: stats.hard || 0,
      ranking: user.profile?.ranking || 0,
      submissionCalendar,
      languageBreakdown,
      mostUsedLanguage,
      recentSubmissions,
      lastFetchTime: Date.now()
    };

  } catch (error) {
    console.error(`[LeetCode] Fetch failed for ${username}:`, error.message);
    throw error; // Propagate to service layer for retry
  }
}

/**
 * Fetches difficulty for a single question
 */
export async function fetchQuestionDifficulty(titleSlug) {
  try {
    const data = await leetcodeRequest(QUESTION_DETAIL_QUERY, { titleSlug });
    return data?.question?.difficulty || 'Unknown';
  } catch (e) {
    console.error(`[LeetCode] Difficulty fetch failed for ${titleSlug}`);
    return 'Unknown';
  }
}
