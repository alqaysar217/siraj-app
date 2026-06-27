'use server';
/**
 * @fileOverview A Genkit flow for summarizing video lesson transcripts.
 *
 * - generateLessonSummary - A function that generates a concise summary of a lesson transcript.
 * - GenerateLessonSummaryInput - The input type for the generateLessonSummary function.
 * - GenerateLessonSummaryOutput - The return type for the generateLessonSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonSummaryInputSchema = z.object({
  lessonTranscript: z
    .string()
    .describe('The full transcript of the video lesson to be summarized.'),
});
export type GenerateLessonSummaryInput = z.infer<
  typeof GenerateLessonSummaryInputSchema
>;

const GenerateLessonSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the video lesson, highlighting key points.'),
});
export type GenerateLessonSummaryOutput = z.infer<
  typeof GenerateLessonSummaryOutputSchema
>;

export async function generateLessonSummary(
  input: GenerateLessonSummaryInput
): Promise<GenerateLessonSummaryOutput> {
  return generateLessonSummaryFlow(input);
}

const lessonSummaryPrompt = ai.definePrompt({
  name: 'lessonSummaryPrompt',
  input: {schema: GenerateLessonSummaryInputSchema},
  output: {schema: GenerateLessonSummaryOutputSchema},
  prompt: `You are an expert educational assistant specializing in summarizing video lesson transcripts.
Your goal is to provide a concise and clear summary that captures the main ideas and key takeaways of the lesson.
Focus on the most important information, making it easy for a student to quickly grasp the content without watching the entire video again.

Lesson Transcript: {{{lessonTranscript}}}`,
});

const generateLessonSummaryFlow = ai.defineFlow(
  {
    name: 'generateLessonSummaryFlow',
    inputSchema: GenerateLessonSummaryInputSchema,
    outputSchema: GenerateLessonSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await lessonSummaryPrompt(input);
    return output!;
  }
);
