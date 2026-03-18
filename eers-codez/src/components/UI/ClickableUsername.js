'use client';
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getLeetCodeProfileURL, isValidUsername } from '@/lib/urlUtils';

export default function ClickableUsername({ username, className = "", showIcon = false, children }) {
    const url = getLeetCodeProfileURL(username);
    const valid = isValidUsername(username);

    if (!username || !valid || !url) {
        return (
            <span className={`text-slate-600 italic cursor-not-allowed ${className}`} title="LeetCode profile unavailable">
                @{children || username || 'unknown'}
            </span>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="View LeetCode Profile"
            className={`inline-flex items-center gap-1 text-blue-400/80 hover:text-blue-400 transition-all duration-300 hover:underline decoration-blue-500/30 underline-offset-4 group/lc ${className}`}
            onClick={(e) => e.stopPropagation()} // Prevent row click from triggering
        >
            <span className="group-hover/lc:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                @{children || username}
            </span>
            {showIcon && (
                <ExternalLink size={10} className="opacity-0 group-hover/lc:opacity-100 transition-opacity" />
            )}
        </a>
    );
}
