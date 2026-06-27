
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
      // رسالة احترافية للمدير تساعده على اكتشاف مكان الرفض الأمني
      const operation = error.context?.operation || 'غير معروفة';
      const path = error.context?.path || 'مسار غير معروف';
      
      toast({
        variant: 'destructive',
        title: 'تنبيه أمني من الخادم',
        description: `تم رفض عملية (${operation}) على المسار (${path}). يرجى التأكد من صلاحيات المستخدم وقواعد Firestore.`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast, auth]);

  return null;
}
