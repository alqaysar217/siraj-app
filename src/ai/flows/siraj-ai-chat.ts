'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat using Direct Fetch.
 * تم تحسين المحرك ليعتمد على النموذج الذي أثبت كفاءته في اختبار المستخدم.
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

    const systemContent = `أنت "سراج AI"، المساعد الذكي الرسمي والودود لمنصة سراج التعليمية.
مهمتك هي مساعدة الطلاب والإجابة على استفساراتهم حول منصة سراج والدورات المتاحة بأسلوب احترافي ومشجع.
استخدم المعلومات التالية (المعرفة الخاصة) للإجابة بدقة:
${knowledge || 'منصة سراج تقدم دورات تقنية متميزة وكتباً تعليمية لتمكين الشباب.'}

قواعد الرد:
1. أجب دائماً باللغة العربية.
2. كن ملهماً، واضحاً، ومختصراً.
3. إذا سألك الطالب عن شيء لا تعرفه، وجهه للتواصل مع الدعم الفني عبر الواتساب.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // إضافة تاريخ المحادثة لذكاء الردود المتتابعة
    if (history && history.length > 0) {
      history.forEach(m => {
        const role = (m.role === 'user') ? 'user' : 'assistant';
        let textContent = "";
        if (typeof m.content === 'string') textContent = m.content;
        else if (Array.isArray(m.content)) textContent = m.content[0]?.text || "";
        else textContent = m.text || "";

        if (textContent) {
          apiMessages.push({ role, content: textContent });
        }
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
          model: 'google/gemma-2-9b-it:free', // استخدام الموديل المستقر من عائلة جيما
          messages: apiMessages,
          temperature: 0.5,
          max_tokens: 800
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
