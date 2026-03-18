import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/lib/models/Student';

export async function GET() {
    try {
        await connectDB();
        const students = await Student.find({}, 'name leetcodeUsername').sort({ name: 1 });
        return NextResponse.json(students);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const { name, leetcodeUsername } = await request.json();

        if (!name || !leetcodeUsername) {
            return NextResponse.json({ error: 'Name and LeetCode username are required' }, { status: 400 });
        }

        const student = await Student.findOneAndUpdate(
            { leetcodeUsername },
            { name, leetcodeUsername },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, student });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        await connectDB();
        const { leetcodeUsername } = await request.json();

        if (!leetcodeUsername) {
            return NextResponse.json({ error: 'LeetCode username is required' }, { status: 400 });
        }

        const result = await Student.deleteOne({ leetcodeUsername });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Student removed from collective' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
