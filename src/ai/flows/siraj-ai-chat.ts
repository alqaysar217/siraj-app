'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat.
 * تم تحسين السرعة القصوى بالاعتماد الكامل على قاعدة المعرفة التي يغذيها الأدمن.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SirajAiChatInputSchema = z.object({
  message: z.string(),
  history: z.array(z.any()).optional(),
  knowledge: z.string().optional(),
});
export type SirajAiChatInput = z.infer<typeof SirajAiChatInputSchema>;

const SirajAiChatOutputSchema = z.object({
  text: z.string(),
});
export type SirajAiChatOutput = z.infer<typeof SirajAiChatOutputSchema>;

/**
 * Server Action الرئيسي
 */
export async function sirajAiChat(input: SirajAiChatInput): Promise<SirajAiChatOutput> {
  try {
    const result = await sirajAiChatFlow(input);
    return { text: result.text };
  } catch (error: any) {
    console.error("AI Flow Error:", error);
    return { text: "❌ أعتذر، واجهت مشكلة في معالجة طلبك حالياً. يرجى المحاولة لاحقاً." };
  }
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
      return { text: "⚠️ عذراً، خدمة الذكاء الاصطناعي غير مفعلة حالياً (API Key Mismatch)." };
    }

    const systemContent = `أنت "سراج AI"، المساعد الذكي الرسمي لمنصة سراج التعليمية.

هويتك وأصلك:
- أنت مساعد لمنصة "سراج" وهي منصة تعليمية تقنية يمنية حضرمية.
- مطور المنصة هو المهندس محمود الحساني ومجموعته (وليد بن قبوس، سلطان باهبري واخرون).
- لا تذكر أي شركة أخرى أو موديل ذكاء اصطناعي؛ أنت تنتمي لسراج فقط.

نطاق عملك (صارم جداً):
1. أجب فقط على ما يخص منصة سراج (الدورات، الكتب، النظام، الدعم).
2. ارفض الإجابة على أي أسئلة خارج نطاق المنصة (مثل الطبخ أو البرمجة العامة خارج سياقنا).
3. منع الغش: ارفض إعطاء حلول مباشرة لأسئلة "تقويم الوحدة". قل: "أنا هنا لمساعدتك على الفهم وليس للحل الجاهز".

معلومات المنصة (من قاعدة المعرفة المحدثة):
${knowledge || 'لا توجد معلومات إضافية متوفرة حالياً من الإدارة.'}

قواعد الرد:
- استخدم الروابط الموفرة في قاعدة المعرفة عند توجيه الطالب لدورة أو كتاب.
- كن ملهماً وودوداً وباللغة العربية الفصحى المبسطة.
- يمنع التخمين؛ إذا لم تجد المعلومة، وجه الطالب لخدمة العملاء عبر الواتساب (+967735952927).`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // إضافة التاريخ لضمان تذكر سياق المحادثة
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(m => {
        const role = (m.role === 'user') ? 'user' : 'assistant';
        let textContent = "";
        if (typeof m.content === 'string') textContent = m.content;
        else if (Array.isArray(m.content)) textContent = m.content[0]?.text || "";
        else textContent = m.text || "";

        if (textContent) apiMessages.push({ role, content: textContent });
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
          model: 'google/gemma-4-31b-it',
          messages: apiMessages,
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;
      return { text: replyText || 'أعتذر، لم أتمكن من صياغة رد حالياً.' };
    } catch (error: any) {
      return { text: "🌐 تعذر الاتصال بالعقل الاصطناعي حالياً. يرجى مراجعة اتصالك بالإنترنت." };
    }
  }
);
