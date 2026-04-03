import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export interface RecoveryEmailParams {
  to: string;
  studentName: string;
  subjectName: string;
  lectureTopic: string;
  lectureDate: string;
  summary: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a recovery email to an absent student
 */
export async function sendRecoveryEmail(params: RecoveryEmailParams): Promise<EmailResult> {
  const { to, studentName, subjectName, lectureTopic, lectureDate, summary } = params;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Ascent Scholar <onboarding@resend.dev>', // Use your verified domain
      to: [to],
      subject: `Missed Class Recovery — ${subjectName} — ${lectureTopic}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .summary { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📚 Missed Class Recovery</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${studentName}</strong>,</p>
                
                <p>Today you were absent from your <strong>${subjectName}</strong> class.</p>
                
                <p><strong>📅 Date:</strong> ${lectureDate}<br>
                <strong>📖 Topic Covered:</strong> ${lectureTopic}</p>
                
                <div class="summary">
                  <h3 style="margin-top: 0; color: #4F46E5;">Lecture Summary</h3>
                  ${summary.split('\n').map(line => `<p>${line}</p>`).join('')}
                </div>
                
                <p>Please review this material and reach out to your instructor if you have any questions.</p>
                
                <p>Best regards,<br>
                <strong>Ascent Scholar Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message from the Missed Class Recovery Engine</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send recovery email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
