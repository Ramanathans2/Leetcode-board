import mongoose from 'mongoose';

const DailyHistorySchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    date: {
        type: String,
        required: true
    }, // Format: "YYYY-MM-DD"
    easySolved: {
        type: Number,
        default: 0
    },
    mediumSolved: {
        type: Number,
        default: 0
    },
    hardSolved: {
        type: Number,
        default: 0
    },
    totalSolved: {
        type: Number,
        default: 0
    },
    impactScore: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure one record per day per student
DailyHistorySchema.index({ studentId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyHistory || mongoose.model('DailyHistory', DailyHistorySchema);
