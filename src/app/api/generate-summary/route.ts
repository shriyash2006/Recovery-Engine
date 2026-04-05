import { NextRequest, NextResponse } from 'next/server';
import { generateLectureSummary } from '@/lib/ai/multi-provider';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentName, topic, content } = body;

    if (!studentName || !topic || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate summary using multi-provider fallback system
    const result = await generateLectureSummary(studentName, topic, content);

    return NextResponse.json({
      summary: result.summary,
      provider: result.provider,
      success: result.success,
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
