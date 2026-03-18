import mongoose from 'mongoose';

const SyncLogSchema = new mongoose.Schema({
    syncTime: { type: Date, default: Date.now },
    type: { type: String, enum: ['manual', 'scheduled'], default: 'manual' },
    status: { type: String, enum: ['success', 'failure', 'partial'], required: true },
    durationMs: { type: Number },
    syncedStudents: { type: Number, default: 0 },
    failedStudents: { type: Number, default: 0 },
    error: { type: String }
}, { timestamps: true });

export default mongoose.models.SyncLog || mongoose.model('SyncLog', SyncLogSchema);
