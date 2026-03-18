/**
 * Elite Delta Service
 * Implements the strict snapshot-based delta calculation algorithm.
 */

export function calculateDeltas(current, snapshot) {
    if (!snapshot) {
        return {
            total: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            anomaly: false
        };
    }

    const total = current.total - (snapshot.totalSolved || snapshot.total || 0);
    const easy = current.easy - (snapshot.easy || 0);
    const medium = current.medium - (snapshot.medium || 0);
    const hard = current.hard - (snapshot.hard || 0);

    const result = {
        total: Math.max(0, total),
        easy: Math.max(0, easy),
        medium: Math.max(0, medium),
        hard: Math.max(0, hard),
        anomaly: total < 0 || easy < 0 || medium < 0 || hard < 0
    };

    if (result.anomaly) {
        console.warn(`[DeltaAnomaly] Negative delta detected for student. Reverting to 0.`);
    }

    return result;
}

export function calculateImpactScore(deltas) {
    return (deltas.easy * 1) + (deltas.medium * 2) + (deltas.hard * 3);
}
