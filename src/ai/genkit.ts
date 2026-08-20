import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * تهيئة Genkit 1.x مع دعم OpenRouter.
 * نقوم بتغليف الملحق بدالة لضمان التوافق مع محرك Genkit 1.x الحديث
 * وتجنب خطأ "plugin is not a function".
 */

export const ai = genkit({
  plugins: [
    (aiInstance: any) => {
      const plugin = openAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      });
      
      // إذا كان الملحق يعود ككائن (إصدار قديم)، نستخدم دالة التسجيل الخاصة به
      if (typeof plugin !== 'function' && (plugin as any).register) {
        (plugin as any).register(aiInstance);
      } else if (typeof plugin === 'function') {
        // إذا كان الملحق دالة (إصدار حديث)، نقوم باستدعائها
        plugin(aiInstance);
      }
    }
  ],
});
