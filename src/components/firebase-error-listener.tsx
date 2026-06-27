
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      // استعادة الرسالة التقنية للمساعدة في تشخيص مشاكل القواعد السحابية
      const operation = error.context?.operation || 'غير معروفة';
      const path = error.context?.path || 'مسار غير معروف';
      
      toast({
        variant: 'destructive',
        title: 'تنبيه أمني من الخادم',
        description: `أهلاً محمود، الخادم يرفض عملية (${operation}) على المسار (${path}). يرجى مراجعة قواعد Firestore لضمان صلاحية الوصول.`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
