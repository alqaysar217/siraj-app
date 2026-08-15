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
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Clock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "+967735952927";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAttempts = parseInt(localStorage.getItem('login_attempts') || '0');
      const lockUntil = parseInt(localStorage.getItem('login_lock_until') || '0');
      const now = Date.now();
      
      setFailedAttempts(storedAttempts);
      if (lockUntil > now) {
        setLockRemaining(Math.ceil((lockUntil - now) / 1000));
      }
    }
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

  const getDeviceFingerprint = () => {
    if (typeof window === 'undefined') return "Unknown";
    let storedId = localStorage.getItem('siraj_device_token');
    if (!storedId) {
      // الكشف عن نظام التشغيل لتسهيل الإدارة
      const ua = navigator.userAgent;
      let os = "Device";
      if (ua.match(/Android/i)) os = "Android";
      else if (ua.match(/iPhone|iPad|iPod/i)) os = "iPhone";
      else if (ua.match(/Windows/i)) os = "Windows";
      else if (ua.match(/Macintosh|Mac OS/i)) os = "MacOS";
      else if (ua.match(/Linux/i)) os = "Linux";
      
      storedId = `${os}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('siraj_device_token', storedId);
    }
    return storedId;
  };

  const handleLogin = async () => {
    if (!auth || !db) return;
    
    if (lockRemaining > 0) {
      toast({ 
        variant: "destructive", 
        title: "الجهاز محظور مؤقتاً", 
        description: `يرجى الانتظار ${Math.floor(lockRemaining / 60)}:${String(lockRemaining % 60).padStart(2, '0')} دقيقة.` 
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال البريد وكلمة المرور." });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      const deviceId = getDeviceFingerprint();
      const newSessionId = `sess_${Date.now()}`;
      
      localStorage.setItem('siraj_session_id', newSessionId);
      localStorage.setItem('siraj_session_timestamp', Date.now().toString());

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // 1. فحص الحظر
        if (userData.status === 'banned') {
          await signOut(auth);
          throw new Error("banned");
        }

        // 2. فحص قفل الأجهزة (جهازين بحد أقصى للطلاب)
        const currentDevices = userData.deviceIds || [];
        const isDeviceKnown = currentDevices.includes(deviceId);
        
        if (userData.role !== 'admin' && !isDeviceKnown && currentDevices.length >= 2) {
          await signOut(auth); // طرده فوراً
          toast({ 
            variant: "destructive", 
            title: "تجاوزت حد الأجهزة", 
            description: "عذراً، يسمح بفتح الحساب من جهازين فقط. يرجى مراجعة الإدارة لتصفير أجهزتك القديمة." 
          });
          setLoading(false);
          return;
        }

        await updateDoc(userDocRef, { 
          lastSessionId: newSessionId, 
          deviceIds: arrayUnion(deviceId)
        });
      } else {
        const profileData = {
          uid: user.uid,
          name: user.displayName || "طالب سراج",
          email: user.email,
          phone: "",
          photoURL: "",
          role: "student",
          status: "active",
          enrolledCourses: [],
          showInLeaderboard: true,
          forcePasswordChange: false,
          lastSessionId: newSessionId,
          deviceIds: [deviceId],
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profileData);
      }

      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lock_until');
      
      router.push("/dashboard");

    } catch (error: any) {
      if (error.message === "banned") {
        toast({ variant: "destructive", title: "الحساب محظور", description: "تم إيقاف صلاحية دخولك للمنصة." });
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('login_attempts', newAttempts.toString());
        
        let desc = "البريد أو كلمة السر غير صحيحة.";
        if (newAttempts >= 5) {
          const lockMinutes = newAttempts - 4;
          const lockUntil = Date.now() + (lockMinutes * 60 * 1000);
          localStorage.setItem('login_lock_until', lockUntil.toString());
          setLockRemaining(lockMinutes * 60);
          desc = `تجاوزت المحاولات. تم حظر الجهاز لـ ${lockMinutes} دقيقة.`;
        }
        
        toast({ variant: "destructive", title: "فشل الدخول", description: desc });
      }
      setLoading(false);
    }
  };

  const getWhatsAppResetUrl = () => {
    const message = `أهلاً سراج، نسيت كلمة السر لحسابي ببريد (${email || "________"}) في منصة سراج، يرجى إرسال رابط استعادة لي.`;
    return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md luxury-shadow border-primary/5 rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-10">
            <div className="mx-auto w-14 h-14 relative mb-4">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">تسجيل الدخول</CardTitle>
            <CardDescription className="font-bold">منصة سراج التعليمية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            
            {lockRemaining > 0 && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-800 animate-in fade-in zoom-in">
                <Clock className="w-6 h-6 shrink-0" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase">محظور مؤقتاً</p>
                  <p className="text-sm font-black" dir="ltr">
                    {Math.floor(lockRemaining / 60)}:{String(lockRemaining % 60).padStart(2, '0')}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-right">
              <Label htmlFor="email" className="font-bold flex items-center gap-2 mr-1">
                <Mail className="w-4 h-4 text-secondary" /> البريد الإلكتروني
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="example@gmail.com" 
                className="h-14 rounded-2xl bg-muted/40 border-primary/5 focus:bg-white px-6" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={loading || lockRemaining > 0} 
              />
            </div>
            
            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="font-bold flex items-center gap-2 mr-1">
                <Lock className="w-4 h-4 text-secondary" /> كلمة المرور
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="h-14 rounded-2xl bg-muted/40 border-primary/5 focus:bg-white px-6" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading || lockRemaining > 0} 
              />
            </div>

            <Button 
              disabled={loading || lockRemaining > 0} 
              onClick={handleLogin} 
              className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/10 mt-2 transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "دخول المنصة"}
            </Button>

            <div className="bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/10 text-center space-y-2">
               <p className="text-[10px] text-muted-foreground font-bold">نسيت بياناتك؟</p>
               <a 
                href={getWhatsAppResetUrl()} 
                target="_blank" 
                className="text-xs text-secondary font-black hover:underline flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                اطلب رابط الاستعادة عبر واتساب
              </a>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-10">
            <div className="text-muted-foreground font-bold text-sm text-center w-full">
              مستخدم جديد؟ <Link href="/auth/register" className="text-secondary font-black hover:underline">أنشئ حسابك الآن</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
