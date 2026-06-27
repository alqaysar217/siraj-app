
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

/**
 * مستمع مركزي لأخطاء Firestore Security Rules.
 * يساعد محمود في اكتشاف محاولات الوصول غير المصرح بها أثناء التطوير.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      // استخراج تفاصيل العملية والمسار من الخطأ السياقي
      const operation = error.context?.operation || 'غير معروفة';
      const path = error.context?.path || 'مسار غير معروف';
      
      console.warn(`Firestore Access Denied: ${operation} at ${path}`);
      
      // إظهار تنبيه بسيط للمسؤول فقط عند حدوث رفض حقيقي
      toast({
        variant: 'destructive',
        title: 'تنبيه أمان من الخادم',
        description: `الخادم يرفض عملية (${operation}) على (${path}). يرجى مراجعة الصلاحيات.`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
