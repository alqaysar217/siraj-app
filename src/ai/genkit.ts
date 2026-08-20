
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * تهيئة Genkit للعمل مع OpenRouter باستخدام واجهة OpenAI.
 * نستخدم openAI من genkitx-openai لضمان التوافق مع OpenRouter.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
