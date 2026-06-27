
'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MessageCircle, ShieldAlert } from 'lucide-react';

const WHATSAPP_NUMBER = "+967775258830";

export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
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

          // منطق الحماية الصارم
          if (data.role === 'student' && !isKickingRef.current) {
            
            // 1. تحقق من الحظر الفوري
            if (data.status === 'banned') {
              isKickingRef.current = true;
              signOut(auth).then(() => {
                toast({
                  variant: "destructive",
                  duration: 10000,
                  title: "تنبيه أمني: تم حظر الحساب",
                  description: "عذراً، لقد تم إيقاف صلاحية دخولك للمنصة فوراً لمخالفة شروط الاستخدام.",
                  action: (
                    <Button variant="outline" size="sm" asChild className="border-white/20 bg-primary/20 text-white font-bold">
                      <a href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=أهلاً محمود، تم إخراجي وحظر حسابي (${user.email}). أرجو التوضيح.`}>
                        <MessageCircle className="w-4 h-4" /> تواصل مع الإدارة
                      </a>
                    </Button>
                  )
                });
                setTimeout(() => { isKickingRef.current = false; }, 5000);
              });
              return;
            }

            // 2. تحقق من الدخول المتعدد (Session ID)
            if (docSnap.metadata.hasPendingWrites) return;
            const isAuthPage = typeof window !== 'undefined' && window.location.pathname.includes('/auth/');
            if (isAuthPage) return;

            const localSessionId = typeof window !== 'undefined' ? localStorage.getItem('siraj_session_id') : null;
            
            if (data.lastSessionId && localSessionId && data.lastSessionId !== localSessionId) {
              isKickingRef.current = true;
              
              signOut(auth).then(() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('siraj_session_id');
                }
                toast({
                  variant: "destructive",
                  duration: 10000,
                  title: "تنبيه أمني: رصد جلسة نشطة أخرى",
                  description: "تم تسجيل الدخول لهذا الحساب من جهاز آخر. تم إنهاء جلستك الحالية لضمان أمان محتواك التعليمي.",
                  action: (
                    <Button variant="outline" size="sm" asChild className="border-white/20 bg-primary/20 text-white font-bold">
                      <a href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=تنبيه أمني: تم إخراجي من حسابي (${user.email}) بسبب رصد جلسة أخرى.`}>
                        <MessageCircle className="w-4 h-4" /> مراسلة الإدارة
                      </a>
                    </Button>
                  )
                });
                setTimeout(() => { isKickingRef.current = false; }, 5000);
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
  }, [db, user, auth, toast, mounted]);

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student'
  };
}
