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
      toast({
        variant: 'destructive',
        title: 'تنبيه النظام',
        description: `لم يظهر شي`,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast, auth]);

  return null;
}
