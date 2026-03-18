import React from 'react';

const tierStyles = {
    Elite: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    Advanced: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Developing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Inactive: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
};

export default function TierBadge({ tier }) {
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${tierStyles[tier] || tierStyles.Inactive}`}>
            {tier}
        </span>
    );
}
