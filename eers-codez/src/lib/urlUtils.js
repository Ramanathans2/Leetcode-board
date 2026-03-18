/**
 * LeetCode URL Utilities
 * Securely generate profile links from stored usernames.
 */

export function getLeetCodeProfileURL(username) {
    if (!username) return null;

    // Basic sanitization: remove any characters that shouldn't be in a LeetCode username
    // LeetCode usernames typically contain alphanumeric characters and hyphens/underscores
    const sanitized = username.trim().replace(/[^a-zA-Z0-9-_]/g, '');

    if (!sanitized) return null;

    return `https://leetcode.com/${sanitized}/`;
}

export function isValidUsername(username) {
    if (!username) return false;
    return /^[a-zA-Z0-9-_]+$/.test(username.trim());
}
