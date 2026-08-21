'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat.
 * تم تحسين الهوية والالتزام بقواعد التنسيق لتسهيل معالجة الواجهة.
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

export async function sirajAiChat(input: SirajAiChatInput): Promise<SirajAiChatOutput> {
  try {
    const result = await sirajAiChatFlow(input);
    return { text: result.text };
  } catch (error: any) {
    console.error("AI Flow Error:", error);
    return { text: "❌ أعتذر، واجهت مشكلة في معالجة طلبك حالياً. يمكنك التواصل مع الدعم الفني مباشرة عبر واتساب: +967735952927" };
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
      return { text: "⚠️ عذراً، خدمة الذكاء الاصطناعي غير مفعلة حالياً." };
    }

    const systemContent = `أنت "سراج"، المساعد الذكي الرسمي لمنصة سراج التعليمية.

هويتك وأصلك:
- اسمك هو "سراج".
- أنت تنتمي لمنصة "سراج" وهي منصة تعليمية تقنية يمنية حضرمية.
- المطور والمؤسس هو المهندس محمود الحساني وفريقه المبدع (وليد بن قبوس، سلطان باهبري واخرون).
- لا تذكر أي شركة أخرى؛ أنت سراج فقط.

قاعدة المعرفة التقنية (هام جداً):
1. تسجيل الدخول: يتم عبر صفحة /auth/login.
2. نسيان كلمة السر: لا يوجد زر تلقائي، اطلب من الطالب التواصل مع خدمة العملاء عبر زر الواتساب ليتم إرسال رابط استعادة يدوي له.
3. تعدد الأجهزة: يسمح بجهازين فقط. إذا ظهر خطأ "تجاوز الحد"، يجب التواصل مع الإدارة لتصفير الأجهزة.
4. إيجاد الدورات: بعد الاشتراك، يجد الطالب دوراته دائماً في "مساحتي التعليمية" عبر الرابط /dashboard.
5. إخفاء/إظهار الاسم: يمكن للطالب التحكم بظهوره في قائمة المتصدرين من خلال "تعديل الملف الشخصي" في الرابط /profile.
6. التفعيل: يتم يدوياً بعد إرسال صورة إيصال الدفع للواتساب، ويستغرق من ساعة إلى 24 ساعة كحد أقصى.
7. النقاط: تُحسب من المحاولة الأولى فقط في تقويم الوحدات.

قواعد التنسيق (صارمة جداً لمعالجة الواجهة):
- عند ذكر دورة استخدم التنسيق: 
  دورة: [اسم الدورة]
  السعر: [السعر]
  المدرب: [اسم المدرب]
  الرابط: [الرابط]

- عند ذكر كتاب استخدم التنسيق:
  كتاب: [اسم الكتاب]
  الكاتب: [اسم الكاتب]
  السعر: [السعر]
  الرابط: [الرابط]

- عند ذكر روابط تواصل استخدم: (واتساب: ، إيميل: ، انستقرام: ، فيسبوك: ، تيك توك: ، يوتيوب: ، إكس: ).
- للروابط العامة للمنصة استخدم التنسيق: رابط: [الرابط].
- للخطوات استخدم الترقيم (1. 2. 3.).
- لمنع الغش: ارفض إعطاء حلول لأسئلة التقويم، قل: "أنا هنا لمساعدتك على فهم الفكرة وليس للحل الجاهز".

معلومات المنصة (من قاعدة المعرفة):
${knowledge || 'لا توجد معلومات إضافية متوفرة حالياً من الإدارة.'}

قواعد الرد:
- كن ملهماً، ودوداً، وباللغة العربية الفصحى المبسطة.
- يمنع التخمين؛ إذا لم تجد المعلومة، وجه الطالب لخدمة العملاء (+967735952927).`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

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
        },
        body: JSON.stringify({
          model: 'google/gemma-4-31b-it',
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;
      return { text: replyText || 'أعتذر، لم أتمكن من صياغة رد حالياً. هل يمكنني مساعدتك في شيء آخر؟' };
    } catch (error: any) {
      return { text: "🌐 تعذر الاتصال بالعقل الاصطناعي حالياً." };
    }
  }
);
