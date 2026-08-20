import { genkit } from 'genkit';

/**
 * تهيئة Genkit 1.x بشكل مبسط.
 * نعتمد الآن على Direct Fetch في التدفقات لضمان أقصى درجات الاستقرار
 * وتجاوز مشاكل توافق ملحقات OpenAI مع بيئة التشغيل.
 */

export const ai = genkit({
  plugins: [], // تم إفراغ الملحقات لتجنب خطأ plugin is not a function
});
