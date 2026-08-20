
'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat.
 * 
 * - sirajAiChat - A function that handles conversation with students about the platform.
 * - SirajAiChatInput - Input containing user message and chat history.
 * - SirajAiChatOutput - The AI's response text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

const SirajAiChatInputSchema = z.object({
  message: z.string().describe('The student\'s question.'),
  history: z.array(MessageSchema).optional().describe('The conversation history for context.'),
  knowledge: z.string().optional().describe('Specific platform knowledge provided by the admin.'),
});
export type SirajAiChatInput = z.infer<typeof SirajAiChatInputSchema>;

const SirajAiChatOutputSchema = z.object({
  text: z.string().describe('The AI response message.'),
});
export type SirajAiChatOutput = z.infer<typeof SirajAiChatOutputSchema>;

export async function sirajAiChat(input: SirajAiChatInput): Promise<SirajAiChatOutput> {
  return sirajAiChatFlow(input);
}

const sirajAiChatFlow = ai.defineFlow(
  {
    name: 'sirajAiChatFlow',
    inputSchema: SirajAiChatInputSchema,
    outputSchema: SirajAiChatOutputSchema,
  },
  async (input) => {
    const { message, history, knowledge } = input;

    const systemPrompt = `أنت "سراج AI"، المساعد الذكي الرسمي لمنصة سراج التعليمية.
مهمتك هي مساعدة الطلاب والإجابة على استفساراتهم حول:
- الدورات المتاحة (برمجة، شبكات، تصميم، محاسبة، إلخ).
- المدربين المعتمدين وخبراتهم.
- الأسعار وطرق الاشتراك (عبر الحسابات البنكية الموضحة في صفحة الدورة).
- كيفية إنشاء حساب وتسجيل الدخول.
- التحقق من صحة الشهادات (عبر صفحة /verify-certificate).
- نظام النقاط (10 نقاط لكل درس، ونقاط إضافية للتقويمات).

تعليمات صارمة:
1. أجب فقط بناءً على المعلومات المتعلقة بمنصة سراج.
2. إذا سُئلت عن شيء خارج نطاق المنصة، اعتذر بلباقة وقل أنك متخصص في شؤون "سراج" فقط.
3. استخدم لهجة ودودة، مشجعة، واحترافية باللغة العربية.
4. استخدم المعلومات التالية كمرجع إضافي:
${knowledge || 'لا توجد معلومات إضافية حالياً.'}

سياق المحادثة السابقة:
${history?.map(m => `${m.role === 'user' ? 'الطالب' : 'سراج AI'}: ${m.content[0].text}`).join('\n')}

سؤال الطالب الحالي: ${message}`;

    // نستخدم الموديل عبر ملحق openai المعرف في genkit.ts
    // ملاحظة: نستخدم البادئة openai/ لضمان توجيه الطلب عبر الملحق الصحيح
    const { text } = await ai.generate({
      model: 'openai/google/gemini-2.0-flash-lite:preview',
      prompt: systemPrompt,
    });

    return { text: text || 'عذراً، لم أستطع فهم طلبك بشكل صحيح. هل يمكنك إعادة صياغة السؤال؟' };
  }
);
