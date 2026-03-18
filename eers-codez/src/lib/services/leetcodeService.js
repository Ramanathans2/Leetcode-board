import { fetchAllDataForUser } from '../leetcode';

/**
 * Elite LeetCode Data Service
 * Provides robust fetching with retry logic and error handling.
 */
export async function fetchEliteLeetCodeData(username) {
    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
        try {
            const data = await fetchAllDataForUser(username);
            if (data) return data;

            throw new Error('Emply profile data received');
        } catch (error) {
            attempt++;
            lastError = error;

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.warn(`[Sync] Attempt ${attempt} failed for ${username}. Retrying in ${delay}ms... Error: ${error.message}`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    console.error(`[Sync] All ${maxRetries} attempts failed for ${username}. Final Error: ${lastError.message}`);
    throw lastError; // Let the caller decide how to handle the failure
}
