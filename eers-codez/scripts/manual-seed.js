const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Simple Schema
const StudentSchema = new mongoose.Schema({
    name: String,
    leetcodeUsername: String,
    registerNumber: String,
    batch: String,
    currentStats: {
        total: { type: Number, default: 0 },
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 }
    },
    lastUpdated: Date
}, { strict: false });

const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/eers-codez');

        const filePath = path.join(process.cwd(), 'src/data/students.xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('Excel file not found');
            process.exit(1);
        }

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet);

        let count = 0;
        for (const row of rawData) {
            const name = row['__EMPTY_2'] || row['Name'];
            let lc = row['__EMPTY_4'] || row['LeetCode'];

            if (lc && typeof lc === 'string' && !lc.toLowerCase().includes('user name') && name) {
                if (lc.includes('/')) lc = lc.split('/').pop().trim();

                await Student.findOneAndUpdate(
                    { leetcodeUsername: lc.toLowerCase().trim() },
                    {
                        name: name.trim(),
                        leetcodeUsername: lc.toLowerCase().trim(),
                        registerNumber: (row['__EMPTY_1'] || '').toString(),
                        batch: 'EE-2025'
                    },
                    { upsert: true }
                );
                count++;
            }
        }

        console.log(`Successfully populated DB with ${count} students.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
