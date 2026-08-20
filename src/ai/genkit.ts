
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * تهيئة Genkit للعمل مع OpenRouter بشكل احترافي.
 * نستخدم "مغلف ملحق" (Plugin Wrapper) لضمان التوافق مع محرك Genkit 1.x 
 * وتجنب خطأ "plugin is not a function" بغض النظر عن طريقة تصدير المكتبة.
 */
export const ai = genkit({
  plugins: [
    (aiInstance: any) => {
      const pluginInstance: any = openAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      });

      // التحقق من نوع الملحق للتعامل مع الأنماط المختلفة للمكتبات (دالة أو كائن)
      if (typeof pluginInstance === 'function') {
        return pluginInstance(aiInstance);
      } else if (pluginInstance && typeof pluginInstance.register === 'function') {
        return pluginInstance.register(aiInstance);
      }
      
      return pluginInstance;
    }
  ],
});
