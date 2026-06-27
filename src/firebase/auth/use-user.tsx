
'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const WHATSAPP_NUMBER = "+967775258830";

export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isKickingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!db || !user || !auth || !mounted) {
      if (user === null) setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);

          // أمن: فحص حالة التغيير الإجباري لكلمة السر
          if (data.forcePasswordChange && !isKickingRef.current) {
            const isChangePassPage = pathname === '/auth/change-password';
            const isAuthFlow = pathname.includes('/auth/');
            
            if (!isChangePassPage && !isAuthFlow) {
              router.replace('/auth/change-password');
              return;
            }
          }

          if (data.role === 'student' && !isKickingRef.current) {
            if (data.status === 'banned') {
              isKickingRef.current = true;
              signOut(auth).then(() => {
                toast({ variant: "destructive", title: "الحساب محظور", description: "تم إيقاف صلاحية دخولك فوراً." });
              });
              return;
            }

            if (docSnap.metadata.hasPendingWrites) return;
            const isAuthPage = pathname.includes('/auth/');
            if (isAuthPage) return;

            const localSessionId = typeof window !== 'undefined' ? localStorage.getItem('siraj_session_id') : null;
            if (data.lastSessionId && localSessionId && data.lastSessionId !== localSessionId) {
              isKickingRef.current = true;
              signOut(auth).then(() => {
                if (typeof window !== 'undefined') localStorage.removeItem('siraj_session_id');
                toast({ variant: "destructive", title: "جلسة أخرى نشطة", description: "تم تسجيل الدخول من جهاز آخر." });
              });
            }
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => setLoading(false)
    );

    return () => unsubscribeProfile();
  }, [db, user, auth, toast, mounted, pathname, router]);

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student'
  };
}
