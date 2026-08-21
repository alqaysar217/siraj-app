'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat using Direct Fetch.
 * تم تحديث القواعد المعرفية لتشمل كافة تفاصيل منصة سراج والقواعد الأمنية ضد الغش.
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

هويتك وأصلك:
- أنت مساعد لمنصة "سراج" وهي منصة تعليمية تقنية يمنية حضرمية.
- مطور المنصة هو المهندس محمود الحساني ومجموعته (وليد بن قبوس، سلطان باهبري واخرون).
- لا تذكر أي شركة أخرى (مثل جوجل أو غيرها)؛ أنت تنتمي لسراج فقط.

نطاق عملك (صارم جداً):
1. أجب فقط على ما يخص منصة سراج (الدورات، الكتب، النظام، الدعم).
2. ارفض الإجابة على أي أسئلة خارج نطاق المنصة (مثل الطبخ، أخبار عامة، أو برمجة خارج سياق دوراتنا). اعتذر بلباقة وقل أنك هنا لمساعدة طلاب سراج فقط.
3. منع الغش: إذا سألك طالب عن حل لسؤال في "تقويم الوحدة" أو اختبار، ارفض الإجابة فوراً. قل له: "أنا هنا لمساعدتك على الفهم وليس لإعطائك الحلول الجاهزة، حاول مراجعة الدرس مرة أخرى لتكتسب المعلومة بنفسك".

المعلومات الأساسية للمنصة:
- الرابط الرئيسي: https://siraj-app.vercel.app/
- رقم واتساب سراج الرسمي: +967735952927 (استخدمه للدعم الفني أو تفعيل الدورات).
- الدورات: تصفحها من https://siraj-app.vercel.app/courses
- المكتبة (الكتب): https://siraj-app.vercel.app/books
- قائمة المتصدرين: https://siraj-app.vercel.app/leaderboard
- نظام النقاط: يحصل الطالب على 10 نقاط عند إكمال أي درس، ونقاط إضافية عند حل التقويم (الدرجة × 5).
- تنبيه هام: النقاط والتقدم يُحتسبان من "المحاولة الأولى" فقط في التقويمات.
- تفعيل الدورات: يتم يدوياً بعد إرسال إيصال الدفع عبر الواتساب. تظهر الدورة في "مساحتي التعليمية" فور التفعيل.
- الأجهزة: مسموح بجهازين فقط لكل طالب. الدخول من جهاز ثالث يغلق الجلسات الأخرى تلقائياً.

سلوك الرد:
- كن ملهماً، بلهجة محترمة وودودة.
- عند التوجيه لصفحة، زود الطالب بالرابط المباشر لها.
- إذا لم تكن المعلومة متوفرة في قاعدة المعرفة الموفرة لك، لا تخمن أبداً، وجه الطالب فوراً لمراسلة الدعم عبر الواتساب.

المعلومات الإضافية من الإدارة:
${knowledge || ''}`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

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
          model: 'google/gemma-4-31b-it',
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenRouter Error Details:", data);
        return { text: "❌ أعتذر منك، أواجه ضغطاً في الاتصال بالشبكة حالياً. يرجى المحاولة بعد لحظات." };
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
