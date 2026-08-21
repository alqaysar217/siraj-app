'use server';
/**
 * @fileOverview A Genkit flow for the Siraj AI assistant chat.
 * يقوم المساعد الآن بجلب بيانات الدورات والمدربين حياً من Firestore مع معالجة أخطاء شاملة لمنع خطأ Unexpected Response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// تهيئة Firebase Admin بشكل آمن للعمل في بيئة الخادم (Server-side only)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
  }
}

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
 * غلاف الـ Server Action الرئيسي
 * تم تحصينه بـ try-catch شامل لضمان إرجاع رد JSON سليم دائماً ومنع انهيار Next.js
 */
export async function sirajAiChat(input: SirajAiChatInput): Promise<SirajAiChatOutput> {
  try {
    const result = await sirajAiChatFlow(input);
    return { text: result.text };
  } catch (error: any) {
    console.error("Critical Server Action Error:", error);
    return { text: "❌ أعتذر، واجهت مشكلة فنية في الاتصال بالخادم. يرجى المحاولة مرة أخرى بعد قليل." };
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
      return { text: "⚠️ عذراً، مفتاح الـ API الخاص بـ OpenRouter غير متوفر حالياً." };
    }

    // 1. جلب البيانات الحية من Firestore (مع عزل الأخطاء لضمان استقرار الرد)
    let coursesInfo = "لا توجد دورات متاحة حالياً.";
    let instructorsInfo = "لا توجد معلومات عن المدربين حالياً.";

    try {
      const db = admin.firestore();
      
      // جلب الدورات وتحويلها لنصوص بسيطة (Strings) لضمان Serialization
      const coursesSnap = await db.collection('courses').limit(15).get();
      if (!coursesSnap.empty) {
        const courses = coursesSnap.docs.map(d => {
          const data = d.data();
          return `- ${data.title}: السعر (${data.price} ر.ي)، المدرب (${data.instructor})`;
        });
        coursesInfo = courses.join('\n');
      }

      // جلب المدربين
      const instructorsSnap = await db.collection('instructors').limit(10).get();
      if (!instructorsSnap.empty) {
        const instructors = instructorsSnap.docs.map(d => {
          const data = d.data();
          return `- ${data.name}: التخصص (${data.specialty})`;
        });
        instructorsInfo = instructors.join('\n');
      }
    } catch (e) {
      console.warn("Firestore data fetch failed, continuing with static info.", e);
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

بيانات المنصة الحية (من قاعدة البيانات):
الدورات المتاحة حالياً:
${coursesInfo}

المدربون المعتمدون:
${instructorsInfo}

المعلومات الأساسية:
- الرابط الرئيسي: https://siraj-app.vercel.app/
- تفعيل الدورات: عبر واتساب سراج (+967735952927).
- الأجهزة: مسموح بالدخول من جهازين فقط لكل طالب.

المعلومات الإضافية من الإدارة:
${knowledge || ''}

سلوك الرد:
- كن ملهماً وودوداً وباللغة العربية الفصحى المبسطة.
- يمنع التخمين؛ إذا لم تجد المعلومة، وجه الطالب لخدمة العملاء عبر الواتساب.`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // إضافة تاريخ المحادثة بشكل سليم
    if (history && Array.isArray(history)) {
      history.slice(-8).forEach(m => {
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
          model: 'google/gemma-4-31b-it', // الموديل الذي نجح في اختبارك
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: 800
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "OpenRouter Connection Failed");
      }

      const replyText = data.choices?.[0]?.message?.content;
      return { text: replyText || 'أعتذر، لم أتمكن من صياغة رد حالياً.' };
    } catch (error: any) {
      console.error("AI Fetch Error:", error);
      return { text: "🌐 تعذر الاتصال بالعقل الاصطناعي حالياً. يرجى مراجعة اتصالك بالإنترنت." };
    }
  }
);
