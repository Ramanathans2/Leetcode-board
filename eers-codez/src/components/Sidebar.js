'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/', label: 'Leaderboard', icon: '🏆' },
    { href: '/daily', label: 'Daily', icon: '📅' },
    { href: '/weekly', label: 'Weekly', icon: '📈' },
    { href: '/import', label: 'Import Students', icon: '📥' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-40"
                style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <Link href="/" className="block no-underline">
                        <h1 className="text-xl font-bold m-0">
                            <span className="neon-blue">EEE</span>{' '}
                            <span className="neon-yellow">Codez</span>
                        </h1>
                        <p className="text-xs mt-1 m-0" style={{ color: 'var(--text-muted)' }}>
                            LeetCode Intelligence Dashboard
                        </p>
                    </Link>
                </div>
                <nav className="flex-1 p-4">
                    <ul className="list-none p-0 m-0 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <motion.div
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Link href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all duration-200
                                            ${isActive
                                                    ? 'text-white font-semibold'
                                                    : 'hover:bg-white/5'}`}
                                            style={{
                                                color: isActive ? 'var(--accent-blue-light)' : 'var(--text-secondary)',
                                                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                            }}>
                                            <span className="text-lg">{item.icon}</span>
                                            <span>{item.label}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeNav"
                                                    className="absolute right-4 w-1.5 h-1.5 rounded-full"
                                                    style={{ background: 'var(--accent-blue)' }}
                                                />
                                            )}
                                        </Link>
                                    </motion.div>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-xs text-center m-0" style={{ color: 'var(--text-muted)' }}>
                        EEE Department Tracker
                    </p>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center py-2 px-4"
                style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg no-underline transition-all duration-200`}
                            style={{
                                color: isActive ? 'var(--accent-blue-light)' : 'var(--text-muted)',
                            }}>
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
