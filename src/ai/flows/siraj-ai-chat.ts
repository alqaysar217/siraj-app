'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat.
 * تم تحسين الهوية والالتزام بقواعد التنسيق لضمان ظهور الأزرار والبطاقات التفاعلية.
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
- محمود الحساني: خريج جامعة حضرموت (نظم معلومات)، مبرمج ومدرب محترف في (SQL, C#, C++, Python, Flutter, Linux).

قواعد الرد الذكي (التزم بها بدقة لتظهر الأزرار في الواجهة):
1. الروابط: أي رابط يبدأ بـ https يجب أن يوضع في تنسيق: رابط: [الرابط].
2. الدورات: عند ذكر دورة استخدم التنسيق التالي بدقة في أربعة أسطر:
   دورة: [اسم الدورة]
   السعر: [السعر]
   المدرب: [اسم المدرب]
   الرابط: [الرابط]
3. الكتب: استخدم التنسيق التالي بدقة:
   كتاب: [اسم الكتاب]
   الكاتب: [اسم الكاتب]
   السعر: [السعر]
   الرابط: [الرابط]
4. البنوك: عند ذكر حسابات بنكية استخدم:
   بنك: [اسم البنك]
   الحساب: [رقم الحساب]
   الصاحب: [اسم صاحب الحساب]
5. القوائم والخطوات: استخدم الترقيم (1. 2. 3.) بوضوح.
6. الجداول: إذا طُلب منك عرض قائمة دورات أو كتب كثيرة، اعرضها في جدول Markdown.
7. التواصل: استخدم هذه الكلمات متبوعة بالبيانات (واتساب: ، إيميل: ، انستقرام: ، فيسبوك: ، تيك توك: ، يوتيوب: ، إكس: ).

معلومات المنصة (من قاعدة المعرفة):
${knowledge || 'لا توجد معلومات إضافية متوفرة حالياً من الإدارة.'}

قواعد الرد:
- كن ملهماً، ودوداً، وباللغة العربية الفصحى المبسطة.
- يمنع التخمين؛ إذا لم تجد المعلومة، وجه الطالب لخدمة العملاء (+967735952927).
- التفعيل يتم خلال أقل من 24 ساعة بعد إرسال صورة الإيصال مع البريد المسجل إلى واتساب سراج.
- لمنع الغش: ارفض إعطاء حلول لأسئلة التقويم، قل: "أنا هنا لمساعدتك على فهم الفكرة وليس للحل الجاهز".`;

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
          model: 'google/gemma-2-27b-it',
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: 2000
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
