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
      return { text: "عذراً، نظام الذكاء الاصطناعي غير مهيأ حالياً (مفتاح API مفقود). يرجى مراجعة إدارة المنصة." };
    }

    // بناء سياق الرسائل لـ OpenRouter
    const systemContent = `أنت "سراج AI"، المساعد الذكي الرسمي لمنصة سراج التعليمية.
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
4. المعلومات الإضافية من الإدارة:
${knowledge || 'لا توجد معلومات إضافية حالياً.'}`;

    const apiMessages: any[] = [
      { role: 'system', content: systemContent }
    ];

    // إضافة التاريخ إذا وجد
    if (history && history.length > 0) {
      history.forEach(m => {
        apiMessages.push({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content[0].text
        });
      });
    }

    // إضافة الرسالة الحالية
    apiMessages.push({ role: 'user', content: message });

    try {
      // الاتصال المباشر بـ OpenRouter لضمان الاستقرار التام
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://siraj-app.vercel.app',
          'X-Title': 'Siraj AI Assistant'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite:preview',
          messages: apiMessages,
          temperature: 0.7,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenRouter API Error:", data);
        throw new Error(data.error?.message || "فشل الاتصال بمحرك الذكاء الاصطناعي");
      }

      const aiResponse = data.choices?.[0]?.message?.content;

      return { 
        text: aiResponse || 'عذراً، لم أستطع فهم طلبك بشكل صحيح. هل يمكنك إعادة صياغة السؤال؟' 
      };
    } catch (error: any) {
      console.error("AI Chat Error Details:", error);
      return { 
        text: "عذراً، أواجه صعوبة في الاتصال بخدمات الذكاء الاصطناعي حالياً. يرجى مراجعة إعدادات OpenRouter." 
      };
    }
  }
);
