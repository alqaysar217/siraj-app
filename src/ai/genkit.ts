import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * تهيئة Genkit 1.x مع دعم OpenRouter.
 * نستخدم دالة مزود (Plugin Provider) لضمان التوافق مع محرك Genkit 1.x وتجنب أخطاء التشغيل.
 */

export const ai = genkit({
  plugins: [
    (aiInstance: any) => {
      try {
        const plugin = openAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1',
        });

        // دعم أنماط الملحقات المختلفة لضمان التسجيل الصحيح
        if (typeof plugin === 'function') {
          plugin(aiInstance);
        } else if (plugin && (plugin as any).register) {
          (plugin as any).register(aiInstance);
        }

        // يجب إرجاع كائن يحتوي على اسم الملحق ليتعرف عليه Genkit
        return { name: 'openai' };
      } catch (error) {
        console.error("OpenAI Plugin Registration Error:", error);
        return { name: 'openai' };
      }
    }
  ],
});
