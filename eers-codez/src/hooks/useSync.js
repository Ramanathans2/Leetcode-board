'use client';
import { useState, useCallback, useEffect } from 'react';

// Simple global event system to trigger refetching across pages
const syncEvent = new Event('sync-complete');

export function useSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [status, setStatus] = useState(null); // 'success' | 'error'

    useEffect(() => {
        const saved = localStorage.getItem('last_sync_time');
        if (saved) setLastSync(new Date(saved));
    }, []);

    const triggerSync = useCallback(async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        setStatus(null);

        try {
            const res = await fetch('/api/sync-now', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                const now = new Date();
                setLastSync(now);
                localStorage.setItem('last_sync_time', now.toISOString());
                setStatus('success');

                // Trigger global refresh event
                window.dispatchEvent(syncEvent);
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    return { isSyncing, lastSync, triggerSync, status };
}

export function useSyncRefresh(callback) {
    useEffect(() => {
        window.addEventListener('sync-complete', callback);
        return () => window.removeEventListener('sync-complete', callback);
    }, [callback]);
}
