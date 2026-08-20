import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * تهيئة Genkit للعمل مع OpenRouter باستخدام واجهة OpenAI.
 * نستخدم openai (بحروف صغيرة) لضمان الحصول على دالة المصنع المتوافقة مع Genkit 1.x.
 */
export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
