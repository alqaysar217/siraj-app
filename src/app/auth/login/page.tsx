
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import { useAuth, useFirestore } from "@/firebase/provider";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Clock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "+967735952927";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // 1. بصمة الجهاز المستقرة (الجهاز وليس المتصفح)
  const getStableDeviceID = () => {
    if (typeof window === 'undefined') return "unknown";
    const ua = navigator.userAgent;
    let os = "Web";
    if (/android/i.test(ua)) os = "Android";
    else if (/iPad|iPhone|iPod/.test(ua)) os = "iOS";
    else if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "MacOS";
    
    // دمج النظام مع دقة الشاشة لتمييز الجهاز حتى لو تغير المتصفح
    return `${os}-${window.screen.width}x${window.screen.height}`;
  };

  useEffect(() => {
    const lockUntil = parseInt(localStorage.getItem('login_lock_until') || '0');
    const now = Date.now();
    if (lockUntil > now) setLockRemaining(Math.ceil((lockUntil - now) / 1000));
  }, []);

  useEffect(() => {
    if (lockRemaining > 0) {
      const timer = setInterval(() => {
        setLockRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            localStorage.removeItem('login_lock_until');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockRemaining]);

  const handleLogin = async () => {
    if (!auth || !db) return;
    if (lockRemaining > 0) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة البريد وكلمة المرور." });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      const deviceId = getStableDeviceID();
      const newSessionId = `sess_${Date.now()}`;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        if (userData.status === 'banned') {
          await signOut(auth);
          toast({ variant: "destructive", title: "الحساب محظور" });
          setLoading(false);
          return;
        }

        const currentDevices = userData.deviceIds || [];
        const isDeviceKnown = currentDevices.includes(deviceId);
        
        // تطبيق قيد الـ 2 أجهزة للأجهزة المستقرة
        if (userData.role !== 'admin' && !isDeviceKnown && currentDevices.length >= 2) {
          await signOut(auth);
          toast({ 
            variant: "destructive", 
            title: "تجاوزت حد الأجهزة المسموح", 
            description: "يسمح بالدخول من جهازين فقط. تواصل مع الإدارة إذا كنت تستخدم أجهزة جديدة." 
          });
          setLoading(false);
          return;
        }

        // تحديث الجلسة وتسجيل الجهاز الجديد إن وجد
        await updateDoc(userDocRef, { 
          lastSessionId: newSessionId, 
          deviceIds: arrayUnion(deviceId)
        });

        localStorage.setItem('siraj_session_id', newSessionId);
        router.replace("/dashboard");
      } else {
        // في حال فشل إنشاء الملف وقت التسجيل، يتم إنشاؤه الآن
        const sessionId = `sess_${Date.now()}`;
        await updateDoc(userDocRef, { 
          uid: user.uid,
          email: user.email,
          lastSessionId: sessionId,
          deviceIds: [deviceId]
        });
        localStorage.setItem('siraj_session_id', sessionId);
        router.replace("/dashboard");
      }
    } catch (error: any) {
      let msg = "البريد أو كلمة السر غير صحيحة.";
      if (error.code === 'auth/user-not-found') msg = "هذا الحساب غير موجود.";
      
      toast({ variant: "destructive", title: "فشل الدخول", description: msg });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md luxury-shadow border-primary/5 rounded-[2.5rem] bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-10">
            <div className="mx-auto w-14 h-14 relative mb-4">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">تسجيل الدخول</CardTitle>
            <CardDescription className="font-bold">منصة سراج التعليمية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 mr-1">
                <Mail className="w-4 h-4 text-secondary" /> البريد الإلكتروني
              </Label>
              <Input 
                type="email" 
                placeholder="example@gmail.com" 
                className="h-14 rounded-2xl bg-muted/40 border-primary/5 px-6" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading} 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 mr-1">
                <Lock className="w-4 h-4 text-secondary" /> كلمة المرور
              </Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="h-14 rounded-2xl bg-muted/40 border-primary/5 px-6" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading} 
              />
            </div>

            <Button 
              disabled={loading || lockRemaining > 0} 
              onClick={handleLogin} 
              className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/10 transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "دخول المنصة"}
            </Button>

            <div className="bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/10 text-center">
               <a 
                href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=نسيت كلمة السر لحسابي ببريد (${email})`} 
                target="_blank" 
                className="text-xs text-secondary font-black hover:underline flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" /> اطلب رابط استعادة كلمة السر
              </a>
            </div>
          </CardContent>
          <CardFooter className="pb-10 justify-center">
            <div className="text-muted-foreground font-bold text-sm">
              مستخدم جديد؟ <Link href="/auth/register" className="text-secondary font-black hover:underline">أنشئ حسابك الآن</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
