'use server';
/**
 * @fileOverview An AI assistant flow for answering student questions about lesson content.
 *
 * - askLessonQuestion - A function that handles student questions about video lesson content.
 * - AskLessonQuestionInput - The input type for the askLessonQuestion function.
 * - AskLessonQuestionOutput - The return type for the askLessonQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskLessonQuestionInputSchema = z.object({
  lessonContent: z.string().describe('The textual content or transcript of the video lesson.'),
  question: z.string().describe('The student\u0027s question about the lesson content.'),
});
export type AskLessonQuestionInput = z.infer<typeof AskLessonQuestionInputSchema>;

const AskLessonQuestionOutputSchema = z.object({
  explanation: z.string().describe('A detailed explanation or clarification based on the lesson content and the student\u0027s question.'),
});
export type AskLessonQuestionOutput = z.infer<typeof AskLessonQuestionOutputSchema>;

export async function askLessonQuestion(input: AskLessonQuestionInput): Promise<AskLessonQuestionOutput> {
  return askLessonQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askLessonQuestionPrompt',
  input: {schema: AskLessonQuestionInputSchema},
  output: {schema: AskLessonQuestionOutputSchema},
  prompt: `أنت مساعد ذكاء اصطناعي خبير ومفيد في مجال التعليم. مهمتك هي الإجابة على أسئلة الطلاب وتقديم شروحات وتوضيحات فورية لمحتوى الدروس.

استخدم محتوى الدرس الموفر أدناه للإجابة على سؤال الطالب. تأكد من أن إجابتك دقيقة، واضحة، ومباشرة وتساعد الطالب على فهم الموضوع بشكل أفضل.

محتوى الدرس: {{{lessonContent}}}
سؤال الطالب: {{{question}}}`,
});

const askLessonQuestionFlow = ai.defineFlow(
  {
    name: 'askLessonQuestionFlow',
    inputSchema: AskLessonQuestionInputSchema,
    outputSchema: AskLessonQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
