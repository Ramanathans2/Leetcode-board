/**
 * EE'rs Codez - Smart Search Parser
 * Parses strings into structured filters including commands (tier:, solved>, etc)
 */

export const parseSearchQuery = (query) => {
    if (!query) return { text: '', commands: [] };

    const parts = query.toLowerCase().split(/\s+/);
    const commands = [];
    const textParts = [];

    parts.forEach(part => {
        // Handle tier:tiername
        if (part.startsWith('tier:')) {
            commands.push({ type: 'tier', value: part.replace('tier:', '') });
        }
        // Handle inactive:days
        else if (part.startsWith('inactive:')) {
            const days = parseInt(part.replace('inactive:', ''));
            if (!isNaN(days)) {
                commands.push({ type: 'inactive', value: days });
            }
        }
        // Handle solved>count, solved<count, solved=count
        else if (part.startsWith('solved')) {
            const op = part.includes('>') ? '>' : part.includes('<') ? '<' : '=';
            const val = parseInt(part.split(op)[1]);
            if (!isNaN(val)) {
                commands.push({ type: 'total', operator: op, value: val });
            }
        }
        // Handle difficulty comparisons: easy>5, medium<10, hard>2
        else if (part.startsWith('easy') || part.startsWith('medium') || part.startsWith('hard')) {
            const type = part.startsWith('easy') ? 'easy' : part.startsWith('medium') ? 'medium' : 'hard';
            const op = part.includes('>') ? '>' : part.includes('<') ? '<' : '=';
            const val = parseInt(part.split(op)[1]);
            if (!isNaN(val)) {
                commands.push({ type, operator: op, value: val });
            }
        }
        // Handle rank:number
        else if (part.startsWith('rank:')) {
            const val = parseInt(part.replace('rank:', ''));
            if (!isNaN(val)) {
                commands.push({ type: 'rank', value: val });
            }
        }
        // Regular text
        else {
            textParts.push(part);
        }
    });

    return {
        text: textParts.join(' '),
        commands
    };
};

/**
 * Filter students based on parsed search results
 */
export const filterStudents = (students, parsedSearch) => {
    const { text, commands } = parsedSearch;

    return students.filter((s, idx) => {
        // 1. Text Search (Name, Username, Tier)
        const nameMatch = s.name?.toLowerCase().includes(text);
        const userMatch = s.leetcodeUsername?.toLowerCase().includes(text);
        const tierMatch = s.tier?.toLowerCase().includes(text);
        const rankMatch = (idx + 1).toString() === text;
        
        if (text && !(nameMatch || userMatch || tierMatch || rankMatch)) return false;

        // 2. Command Checks
        for (const cmd of commands) {
            if (cmd.type === 'tier') {
                if (s.tier?.toLowerCase() !== cmd.value) return false;
            }
            if (cmd.type === 'inactive') {
                if (!s.lastSubmissionTime) return false;
                const diffDays = (new Date() - new Date(s.lastSubmissionTime)) / (1000 * 60 * 60 * 24);
                if (diffDays < cmd.value) return false;
            }
            if (cmd.type === 'total' || cmd.type === 'easy' || cmd.type === 'medium' || cmd.type === 'hard') {
                const val = cmd.type === 'total' ? (s.currentStats?.total || 0) : (s.currentStats?.[cmd.type] || 0);
                if (cmd.operator === '>' && val <= cmd.value) return false;
                if (cmd.operator === '<' && val >= cmd.value) return false;
                if (cmd.operator === '=' && val !== cmd.value) return false;
            }
            if (cmd.type === 'rank') {
                if ((idx + 1) !== cmd.value) return false;
            }
        }

        return true;
    });
};

/**
 * Highlighting utility for search matches
 */
export const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() 
            ? <span key={i} className="text-blue-400 underline underline-offset-4 decoration-blue-500/50">{part}</span> 
            : part
    );
};
