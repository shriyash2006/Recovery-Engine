import { NextRequest, NextResponse } from 'next/server';
import { sendRecoveryEmail } from '@/lib/email/resend-client';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured. Please add RESEND_API_KEY to .env file.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { to, studentName, subjectName, lectureTopic, lectureDate, summary } = body;

    console.log('Sending email to:', to);

    // Validate required fields
    if (!to || !studentName || !subjectName || !lectureTopic || !lectureDate || !summary) {
      console.error('Missing required fields:', { to, studentName, subjectName, lectureTopic, lectureDate, summary: summary ? 'present' : 'missing' });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the email
    const result = await sendRecoveryEmail({
      to,
      studentName,
      subjectName,
      lectureTopic,
      lectureDate,
      summary,
    });

    if (!result.success) {
      console.error('Email send failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', result.messageId);
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
