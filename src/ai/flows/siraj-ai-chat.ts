'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat using Direct Fetch to OpenRouter.
 * 
 * - sirajAiChat - Handles conversation with students using direct API calls to Qwen 2.5.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SirajAiChatInputSchema = z.object({
  message: z.string().describe('The student\'s question.'),
  history: z.array(z.any()).optional().describe('The conversation history for context.'),
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
      return { text: "⚠️ عذراً، مفتاح الـ API الخاص بـ OpenRouter غير متوفر في إعدادات الخادم." };
    }

    const systemContent = `أنت "سراج AI"، المساعد الذكي الرسمي لمنصة سراج التعليمية.
مهمتك هي مساعدة الطلاب والإجابة على استفساراتهم حول منصة سراج فقط بأسلوب ودي واحترافي.
المعلومات الإضافية من الإدارة لتلتزم بها:
${knowledge || 'لا توجد معلومات إضافية حالياً.'}`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    if (history && history.length > 0) {
      history.forEach(m => {
        apiMessages.push({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content?.[0]?.text || m.text || ""
        });
      });
    }

    apiMessages.push({ role: 'user', content: message });

    try {
      // استخدام موديل Qwen 2.5 7B Instruct المجاني وهو الأفضل حالياً في الاستقرار والأداء
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://siraj-app.vercel.app',
          'X-Title': 'Siraj AI Assistant'
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-7b-instruct:free', 
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenRouter Error Details:", data);
        const errorMsg = data.error?.message || 'فشل الاتصال بمزود الخدمة';
        return { text: `❌ حدث خطأ في النظام: ${errorMsg}.` };
      }

      const aiResponse = data.choices?.[0]?.message?.content;

      return { 
        text: aiResponse || 'أعتذر، لم أتمكن من صياغة رد حالياً. حاول مرة أخرى لاحقاً.' 
      };
    } catch (error: any) {
      console.error("AI Chat Network Error:", error);
      return { 
        text: `🌐 تعذر الاتصال بالشبكة الذكية: ${error.message}.` 
      };
    }
  }
);
