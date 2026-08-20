import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * تهيئة Genkit 1.x مع دعم OpenRouter.
 * نستخدم كائن ملحق صريح يحتوي على اسم (name) لتجنب أخطاء تعريف الملحقات في المحرك الجديد.
 */

export const ai = genkit({
  plugins: [
    {
      // يجب أن يكون الاسم 'openai' ليتطابق مع بادئة الموديلات المستخدمة في التدفقات
      name: 'openai',
      register: (aiInstance: any) => {
        try {
          // التأكد من أن الدالة المستوردة موجودة وصالحة
          const pluginFactory = openAI;
          if (typeof pluginFactory !== 'function') {
            console.error("Critical: openAI from genkitx-openai is not a valid function.");
            return;
          }

          const p = pluginFactory({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
          });

          // دعم أنماط الملحقات المختلفة (دالة أو كائن يحتوي على register)
          if (typeof p === 'function') {
            p(aiInstance);
          } else if (p && (p as any).register) {
            (p as any).register(aiInstance);
          }
        } catch (error) {
          console.error("OpenAI Plugin Registration Error:", error);
        }
      }
    } as any
  ],
});
