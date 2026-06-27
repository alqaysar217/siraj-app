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
      const uid = auth?.currentUser?.uid || 'غير معروف';
      
      toast({
        variant: 'destructive',
        title: 'فشل في الحفظ (صلاحيات)',
        description: `أهلاً سراج، الخادم يرفض العملية لـ (ID: ${uid}). لقد قمت الآن بتحديث القواعد السحابية. يرجى الانتظار 30 ثانية لتحديث المزامنة ثم المحاولة مرة أخرى.`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast, auth]);

  return null;
}