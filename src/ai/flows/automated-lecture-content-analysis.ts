'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing lecture content.
 *
 * - automatedLectureContentAnalysis - A function that orchestrates the analysis of lecture plans and study materials.
 * - AutomatedLectureContentAnalysisInput - The input type for the automatedLectureContentAnalysis function.
 * - AutomatedLectureContentAnalysisOutput - The return type for the automatedLectureContentAnalysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const StudyMaterialSchema = z.object({
  dataUri: z.string().describe(
    "A study material file (PDF/PPTX), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  fileName: z.string().describe('The original file name of the study material.'),
});

const AutomatedLectureContentAnalysisInputSchema = z.object({
  lecturePlanText: z.string().describe('The full text content of the lecture plan.'),
  studyMaterials: z.array(StudyMaterialSchema).describe('An array of study materials (PDFs/PPTXs) to be analyzed.'),
});
export type AutomatedLectureContentAnalysisInput = z.infer<typeof AutomatedLectureContentAnalysisInputSchema>;

// Output Schema
const StudyMaterialReferenceSchema = z.object({
  fileName: z.string().describe('The file name of the referenced study material.'),
  relevantSections: z.string().describe('A brief description of relevant sections or topics found in this study material for the current lecture section. The AI should synthesize this from the study material content.'),
});

const SectionAnalysisSchema = z.object({
  sectionTitle: z.string().describe('The title of the section as identified from the lecture plan.'),
  studyMaterialReferences: z.array(StudyMaterialReferenceSchema).describe('References to study materials relevant to this section.'),
});

const ModuleAnalysisSchema = z.object({
  moduleTitle: z.string().describe('The title of the module as identified from the lecture plan.'),
  sections: z.array(SectionAnalysisSchema).describe('An array of sections within this module, with their corresponding study material references.'),
});

const AutomatedLectureContentAnalysisOutputSchema = z.object({
  analyzedModules: z.array(ModuleAnalysisSchema).describe('An array of modules, each containing topics and references to relevant study materials.'),
});
export type AutomatedLectureContentAnalysisOutput = z.infer<typeof AutomatedLectureContentAnalysisOutputSchema>;

export async function automatedLectureContentAnalysis(
  input: AutomatedLectureContentAnalysisInput
): Promise<AutomatedLectureContentAnalysisOutput> {
  return automatedLectureContentAnalysisFlow(input);
}

const analyzeLectureContentPrompt = ai.definePrompt({
  name: 'analyzeLectureContentPrompt',
  input: { schema: AutomatedLectureContentAnalysisInputSchema },
  output: { schema: AutomatedLectureContentAnalysisOutputSchema },
  prompt: `You are an expert academic assistant tasked with analyzing lecture plans and associated study materials.
Your goal is to identify the main modules and sections from a given lecture plan and then map them to the provided study materials.

Follow these steps:
1.  Carefully read and understand the "Lecture Plan". Identify the primary modules and their sub-sections.
2.  For each identified module and section, examine the provided "Study Materials".
3.  Determine which study material (identified by its file name) is most relevant to each lecture section.
4.  For each relevant study material, provide a brief summary or description of the specific parts within that material that cover the lecture section's content. Focus on identifying key topics or areas within the document that align with the lecture section.
5.  Structure your output as an array of modules, where each module contains its sections, and each section lists relevant study material references.

Ensure the output strictly adheres to the provided JSON schema.

---
Lecture Plan:
{{{lecturePlanText}}}

---
Study Materials:
{{#each studyMaterials}}
  File Name: {{{fileName}}}
  Content: {{media url=this.dataUri}}
{{/each}}`,
});

const automatedLectureContentAnalysisFlow = ai.defineFlow(
  {
    name: 'automatedLectureContentAnalysisFlow',
    inputSchema: AutomatedLectureContentAnalysisInputSchema,
    outputSchema: AutomatedLectureContentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeLectureContentPrompt(input);
    return output!;
  }
);
