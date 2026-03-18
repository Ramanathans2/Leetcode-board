import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    leetcodeUsername: { type: String, required: true, unique: true },
    registerNumber: { type: String, default: '' },
    batch: { type: String, default: '' },
    currentStats: {
        total: { type: Number, default: 0 },
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
    },
    mostUsedLanguage: { type: String, default: 'N/A' },
    overallImpactScore: { type: Number, default: 0 },
    tier: { type: String, default: 'Developing' }, // Elite, Advanced, Developing, Inactive
    momentumTrend: { type: String, default: 'stable' }, // up, down, stable
    streak: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    difficultyIndex: { type: Number, default: 0 },
    momentumScore: { type: Number, default: 0 },
    weeklyGrowth: { type: Number, default: 0 },
    todaySolved: { type: Number, default: 0 },
    weeklySolved: { type: Number, default: 0 },
    recentSubmissions: { type: Array, default: [] },
    submissionCalendar: { type: Object, default: {} },
    languageBreakdown: { type: Object, default: {} },
    lastSubmissionTime: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
