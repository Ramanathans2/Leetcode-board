import mongoose from 'mongoose';

const DailySnapshotSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    leetcodeUsername: { type: String, required: true },
    date: { type: Date, required: true }, // Midnight UTC
    totalSolved: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    easyDelta: { type: Number, default: 0 },
    mediumDelta: { type: Number, default: 0 },
    hardDelta: { type: Number, default: 0 },
    impactScore: { type: Number, default: 0 },
    dailySolved: { type: Number, default: 0 },
    weeklySolved: { type: Number, default: 0 },
    languageBreakdown: { type: Object, default: {} },
}, { timestamps: true });

DailySnapshotSchema.index({ studentId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailySnapshot || mongoose.model('DailySnapshot', DailySnapshotSchema);
