'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat.
 * يقوم المساعد الآن بجلب بيانات الدورات والمدربين حياً من Firestore للإجابة بدقة.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// تهيئة Firebase Admin للوصول للبيانات من جهة الخادم
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (error) {
    console.error("Firebase Admin Error:", error);
  }
}

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
      return { text: "⚠️ عذراً، مفتاح الـ API الخاص بـ OpenRouter غير متوفر." };
    }

    // 1. جلب البيانات الحية من Firestore
    let coursesInfo = "لا توجد دورات متاحة حالياً.";
    let instructorsInfo = "لا توجد معلومات عن المدربين حالياً.";

    try {
      const db = admin.firestore();
      
      // جلب الدورات
      const coursesSnap = await db.collection('courses').get();
      if (!coursesSnap.empty) {
        const courses = coursesSnap.docs.map(d => {
          const data = d.data();
          return `- ${data.title}: السعر (${data.price} ر.ي)، المدرب (${data.instructor})، المستوى (${data.level})`;
        });
        coursesInfo = courses.join('\n');
      }

      // جلب المدربين
      const instructorsSnap = await db.collection('instructors').get();
      if (!instructorsSnap.empty) {
        const instructors = instructorsSnap.docs.map(d => {
          const data = d.data();
          return `- ${data.name}: التخصص (${data.specialty})، الاعتماد (${data.accreditation})`;
        });
        instructorsInfo = instructors.join('\n');
      }
    } catch (e) {
      console.error("Error fetching live data for AI:", e);
    }

    const systemContent = `أنت "سراج AI"، المساعد الذكي الرسمي لمنصة سراج التعليمية.

هويتك وأصلك:
- أنت مساعد لمنصة "سراج" وهي منصة تعليمية تقنية يمنية حضرمية.
- مطور المنصة هو المهندس محمود الحساني ومجموعته (وليد بن قبوس، سلطان باهبري واخرون).
- لا تذكر أي شركة أخرى؛ أنت تنتمي لسراج فقط.

نطاق عملك (صارم جداً):
1. أجب فقط على ما يخص منصة سراج (الدورات، الكتب، النظام، الدعم).
2. ارفض الإجابة على أي أسئلة خارج نطاق المنصة (مثل الطبخ أو البرمجة العامة خارج سياقنا).
3. منع الغش: ارفض إعطاء حلول مباشرة لأسئلة "تقويم الوحدة". قل: "أنا هنا لمساعدتك على الفهم وليس للحل الجاهز".

بيانات المنصة الحية (استخدمها للإجابة بدقة):
الدورات المتاحة حالياً وأسعارها:
${coursesInfo}

المدربون في المنصة:
${instructorsInfo}

المعلومات الأساسية:
- الرابط الرئيسي: https://siraj-app.vercel.app/
- صفحة الدورات: /courses
- المكتبة: /books
- المتصدرون: /leaderboard
- التفعيل: عبر واتساب سراج (+967735952927) بإرسال إيصال الدفع.
- الأجهزة: مسموح بجهازين فقط.

المعلومات الإضافية من الإدارة:
${knowledge || ''}

سلوك الرد:
- كن ملهماً وودوداً وباللغة العربية.
- عند التوجيه لصفحة، زود الطالب بالرابط المباشر.
- إذا لم تجد المعلومة، لا تخمن، وجه الطالب للواتساب المذكور.`;

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
        return { text: "❌ أعتذر، واجهت مشكلة في الاتصال بالخادم الذكي." };
      }

      return { text: data.choices?.[0]?.message?.content || 'أعتذر، لم أتمكن من صياغة رد.' };
    } catch (error: any) {
      return { text: "🌐 تعذر الاتصال بالشبكة الذكية حالياً." };
    }
  }
);
