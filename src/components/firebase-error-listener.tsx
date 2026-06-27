
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase/provider';

export function FirebaseErrorListener() {
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    const handleError = (error: any) => {
      // استعادة الرسالة التفصيلية لمساعدة محمود في اكتشاف المشاكل أثناء التطوير
      const operation = error.context?.operation || 'غير معروفة';
      const path = error.context?.path || 'مسار غير معروف';
      
      toast({
        variant: 'destructive',
        title: 'تنبيه من الخادم السحابي',
        description: `أهلاً محمود، الخادم يرفض العملية لـ (${operation}) على المسار (${path}). يرجى التأكد من قواعد الحماية في Firebase.`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast, auth]);

  return null;
}
