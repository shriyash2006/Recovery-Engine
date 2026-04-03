'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a personalized missed lecture recovery package for students.
 *
 * - personalizedMissedLectureRecovery - A function that orchestrates the generation of a lecture summary and relevant study material references for absent students.
 * - PersonalizedMissedLectureRecoveryInput - The input type for the personalizedMissedLectureRecovery function.
 * - PersonalizedMissedLectureRecoveryOutput - The return type for the personalizedMissedLectureRecovery function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const PersonalizedMissedLectureRecoveryInputSchema = z.object({
  studentName: z.string().describe("The name of the absent student."),
  studentEmail: z.string().describe("The email address of the absent student."),
  lectureTopic: z.string().describe("The main topic covered in the missed lecture."),
  lectureDate: z.string().describe("The date of the missed lecture in YYYY-MM-DD format."),
  lecturePlanDetails: z.string().describe("Detailed description of what was covered in the lecture, based on the lecture plan, providing context for the AI."),
  extractedStudyMaterialText: z.string().describe("The full text content extracted from all relevant study materials (e.g., PDF/PPTX slides) for the missed lecture."),
  extractedHeadings: z.array(
    z.object({
      heading: z.string().describe("A specific heading or sub-topic from the study material."),
      pageNumbers: z.array(z.number()).describe("An array of page numbers where this heading/topic is discussed.")
    })
  ).describe("A structured list of headings/topics extracted from the study material along with their corresponding page numbers. This helps the AI identify relevant sections.")
});
export type PersonalizedMissedLectureRecoveryInput = z.infer<typeof PersonalizedMissedLectureRecoveryInputSchema>;

// Output Schema
const PersonalizedMissedLectureRecoveryOutputSchema = z.object({
  lectureSummary: z.string().describe("A concise, AI-generated summary of the missed lecture content, tailored to the lecture topic and plan."),
  relevantMaterialReferences: z.array(
    z.object({
      topic: z.string().describe("A relevant topic or heading from the study material."),
      pages: z.array(z.number()).describe("The page numbers where the relevant topic is discussed.")
    })
  ).describe("A list of the most relevant topics/headings and their corresponding page numbers from the provided study material, identified for the student."),
  emailSubject: z.string().describe("The suggested subject line for the email to be sent to the student."),
  emailBody: z.string().describe("The complete, formatted body of the email to be sent to the student, including the summary and relevant material references.")
});
export type PersonalizedMissedLectureRecoveryOutput = z.infer<typeof PersonalizedMissedLectureRecoveryOutputSchema>;


// Prompt Definition
const personalizedMissedLectureRecoveryPrompt = ai.definePrompt({
  name: 'personalizedMissedLectureRecoveryPrompt',
  input: { schema: PersonalizedMissedLectureRecoveryInputSchema },
  output: { schema: PersonalizedMissedLectureRecoveryOutputSchema },
  prompt: `You are an intelligent assistant designed to help students catch up on missed lectures. Your task is to generate a concise summary of a missed lecture and identify relevant sections from provided study materials. Finally, you will compose a personalized email for the student.

Here is the information about the missed lecture and the student:
Student Name: {{{studentName}}}
Student Email: {{{studentEmail}}}
Lecture Topic: {{{lectureTopic}}}
Lecture Date: {{{lectureDate}}}
Lecture Plan Details (what was intended to be covered): {{{lecturePlanDetails}}}

Here is the extracted full text content from the study materials relevant to this lecture:
"""
{{{extractedStudyMaterialText}}}
"""

Here is a structured list of headings and their page numbers from the study materials:
{{{extractedHeadings}}}

Based on the above information, perform the following steps:
1.  **Generate a concise summary** of the missed lecture content. Focus on the main points related to "{{{lectureTopic}}}" as described in the "Lecture Plan Details". The summary should be easy to understand for a student who missed the class.
2.  **Identify the most relevant topics/headings** from the 'extractedHeadings' that directly correspond to the 'Lecture Topic' and 'Lecture Plan Details'. For each identified topic, list the 'heading' and its 'pageNumbers'. This will form the 'relevantMaterialReferences'.
3.  **Compose an email subject line** that is clear and professional, for example: "Catching Up: Your Missed Lecture on [Lecture Topic] - [Lecture Date]".
4.  **Compose the complete email body** for the student.
    *   Start with a friendly greeting using the student's name.
    *   Provide the generated lecture summary.
    *   Clearly list the "Relevant Study Material Sections" with their topics and page numbers, explaining that these are key areas to review in their notes/PDFs.
    *   End with a supportive closing.

Ensure your output strictly adheres to the JSON schema provided.

Example for 'relevantMaterialReferences' in JSON:
[
  { "topic": "Introduction to Operating Systems", "pages": [1, 2, 3] },
  { "topic": "Process Management", "pages": [10, 11, 12] }
]

Example for 'extractedHeadings' input (you need to use this to find relevant topics for 'relevantMaterialReferences'):
[
  { "heading": "Introduction to Operating Systems", "pageNumbers": [1, 2, 3] },
  { "heading": "What is an OS?", "pageNumbers": [2] },
  { "heading": "Types of Operating Systems", "pageNumbers": [4, 5] },
  { "heading": "Process Management", "pageNumbers": [10, 11, 12] },
  { "heading": "CPU Scheduling", "pageNumbers": [15, 16] }
]
`
});

// Flow Definition
const personalizedMissedLectureRecoveryFlow = ai.defineFlow(
  {
    name: 'personalizedMissedLectureRecoveryFlow',
    inputSchema: PersonalizedMissedLectureRecoveryInputSchema,
    outputSchema: PersonalizedMissedLectureRecoveryOutputSchema,
  },
  async (input) => {
    const { output } = await personalizedMissedLectureRecoveryPrompt(input);
    return output!;
  }
);

// Wrapper function
export async function personalizedMissedLectureRecovery(
  input: PersonalizedMissedLectureRecoveryInput
): Promise<PersonalizedMissedLectureRecoveryOutput> {
  return personalizedMissedLectureRecoveryFlow(input);
}
