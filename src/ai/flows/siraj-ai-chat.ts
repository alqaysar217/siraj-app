'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat using Direct Fetch to OpenRouter.
 * 
 * - sirajAiChat - Handles conversation with students using direct API calls.
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
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Critical: OPENROUTER_API_KEY is missing.");
      return { text: "⚠️ مفتاح الـ API الخاص بـ OpenRouter مفقود في إعدادات الخادم (.env). يرجى إضافته ليعمل المساعد." };
    }

    const systemContent = `أنت "سراج AI"، المساعد الذكي الرسمي لمنصة سراج التعليمية.
مهمتك هي مساعدة الطلاب والإجابة على استفساراتهم حول منصة سراج فقط.
المعلومات الإضافية من الإدارة:
${knowledge || 'لا توجد معلومات إضافية حالياً.'}`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    if (history && history.length > 0) {
      history.forEach(m => {
        apiMessages.push({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content[0].text
        });
      });
    }

    apiMessages.push({ role: 'user', content: message });

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://siraj-app.vercel.app',
          'X-Title': 'Siraj AI Assistant'
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5', // استخدام موديل أكثر استقراراً
          messages: apiMessages,
          temperature: 0.7,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenRouter API Error:", data);
        return { text: `❌ خطأ من OpenRouter: ${data.error?.message || 'فشل الاتصال'}. تأكد من وجود رصيد في حسابك.` };
      }

      const aiResponse = data.choices?.[0]?.message?.content;

      return { 
        text: aiResponse || 'لم أستطع معالجة الرد، حاول مرة أخرى.' 
      };
    } catch (error: any) {
      console.error("AI Chat Network Error:", error);
      return { 
        text: `🌐 مشكلة في الاتصال بالشبكة: ${error.message}. تأكد من جودة الإنترنت وحالة سيرفرات OpenRouter.` 
      };
    }
  }
);
