
'use client';

import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isKickingRef = useRef(false);

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
    if (!db || !user || !auth) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, 
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);

          if (data.role === 'student' && !isKickingRef.current) {
            if (data.status === 'banned') {
              isKickingRef.current = true;
              await signOut(auth);
              toast({ variant: "destructive", title: "الحساب محظور", description: "تم إيقاف صلاحية دخولك فوراً." });
              return;
            }

            const localSessionId = localStorage.getItem('siraj_session_id');
            if (data.lastSessionId && localSessionId && data.lastSessionId !== localSessionId) {
              isKickingRef.current = true;
              await signOut(auth);
              localStorage.removeItem('siraj_session_id');
              toast({ variant: "destructive", title: "تنبيه أمني", description: "تم تسجيل الدخول من جهاز آخر، تم إنهاء هذه الجلسة." });
              return;
            }
          }
          setLoading(false);
        } else {
          // نظام الترميم التلقائي المحسن
          try {
            const repairData = {
              uid: user.uid,
              name: user.displayName || "طالب سراج",
              email: user.email,
              role: "student",
              status: "active",
              enrolledCourses: [],
              showInLeaderboard: true,
              deviceIds: [],
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, repairData, { merge: true });
          } catch (e) {
            console.error("Profile repair failed");
          }
        }
      },
      (error) => {
        console.error("Profile sync error", error);
        // منع التعليق في حال وجود خطأ في الصلاحيات للحظات
        setLoading(false);
      }
    );

    const backupTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => {
      unsubscribeProfile();
      clearTimeout(backupTimeout);
    };
  }, [db, user, auth, toast]);

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student'
  };
}
