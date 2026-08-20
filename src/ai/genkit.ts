
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * تهيئة Genkit 1.x مع دعم OpenRouter.
 * نستخدم نمطاً مرناً لتسجيل الملحق لضمان التوافق مع إصدارات المكتبة المختلفة.
 */

// إعداد خيارات OpenAI لـ OpenRouter
const openAiOptions = {
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
};

// استدعاء دالة بناء الملحق
const openAiPlugin = openAI(openAiOptions);

export const ai = genkit({
  plugins: [
    // في Genkit 1.x، الملحقات يجب أن تكون دوال. 
    // إذا كان الملحق المستورد يعود ككائن، نقوم بتغليفه في دالة.
    typeof openAiPlugin === 'function' ? openAiPlugin : () => openAiPlugin,
  ],
});
