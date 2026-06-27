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
import { Loader2, Mail, Lock, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "+967775258830";

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
    const ua = navigator.userAgent;
    let deviceName = "Device";
    if (/android/i.test(ua)) deviceName = "Android";
    else if (/iPad|iPhone|iPod/.test(ua)) deviceName = "iOS";
    else if (/Windows/i.test(ua)) deviceName = "Windows";
    
    let storedId = localStorage.getItem('siraj_device_token');
    if (!storedId) {
      storedId = `${deviceName}-${Math.random().toString(36).substring(2, 7)}`;
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

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال البريد وكلمة المرور." });
      return;
    }

    setLoading(true);

    try {
      // 1. تسجيل الدخول - فحص البيانات مع خادم Firebase
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      // 2. تجهيز بيانات الجلسة الجديدة
      const deviceId = getDeviceFingerprint();
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const isDefaultPass = cleanPassword === 'student123';

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      // 3. تحديث قاعدة البيانات بالسيرفر أولاً
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.status === 'banned') {
          await signOut(auth);
          toast({ variant: "destructive", title: "الحساب محظور", description: "لقد تم إيقاف صلاحية دخولك للمنصة." });
          setLoading(false);
          return;
        }

        await updateDoc(userDocRef, { 
          lastSessionId: newSessionId, 
          deviceIds: arrayUnion(deviceId),
          forcePasswordChange: userData.forcePasswordChange || isDefaultPass
        });
      } else {
        // دعم الحسابات القديمة التي ليس لها ملف Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || "طالب سراج",
          email: user.email,
          role: "student",
          status: "active",
          lastSessionId: newSessionId,
          deviceIds: [deviceId],
          createdAt: new Date().toISOString(),
          forcePasswordChange: isDefaultPass
        });
      }

      // 4. حفظ الجلسة محلياً مع ختم زمني لمنع طرد "السباق التقني"
      localStorage.setItem('siraj_session_id', newSessionId);
      localStorage.setItem('siraj_session_timestamp', Date.now().toString());

      // 5. تصفير الحظر تماماً عند النجاح
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lock_until');
      setFailedAttempts(0);

      // 6. التوجيه بناءً على حالة كلمة السر
      const finalUserSnap = await getDoc(userDocRef);
      if (isDefaultPass || finalUserSnap.data()?.forcePasswordChange) {
        router.push("/auth/change-password");
      } else {
        router.push("/dashboard");
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      
      // معالجة خطأ بيانات الدخول غير الصحيحة (invalid-credential)
      const isCredentialError = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found';
      
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());
      
      let title = "خطأ في الدخول";
      let desc = isCredentialError ? "البريد أو كلمة السر غير صحيحة." : "حدث خطأ غير متوقع في الاتصال بالخادم.";

      // نظام الحظر التصاعدي
      if (newAttempts >= 5) {
        const lockMinutes = newAttempts - 4; 
        const lockUntil = Date.now() + (lockMinutes * 60 * 1000);
        localStorage.setItem('login_lock_until', lockUntil.toString());
        setLockRemaining(lockMinutes * 60);
        title = "تم تقييد الجهاز";
        desc = `تجاوزت المحاولات المسموحة. تم حظرك لمدة ${lockMinutes} دقيقة.`;
      } else if (isCredentialError) {
        desc = `كلمة السر غير صحيحة. متبقي لك ${5 - newAttempts} محاولات قبل الحظر المؤقت.`;
      }
      
      toast({ variant: "destructive", title, description: desc });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md luxury-shadow border-primary/5 rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-10">
            <div className="mx-auto w-14 h-14 relative mb-4 transition-transform hover:scale-110">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">تسجيل الدخول</CardTitle>
            <CardDescription className="font-bold">مرحباً بك في بيئة التعلم الآمنة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            
            {lockRemaining > 0 && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-800 animate-pulse">
                <Clock className="w-6 h-6 shrink-0" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase">الجهاز محظور مؤقتاً</p>
                  <p className="text-sm font-black">
                    يرجى الانتظار: {Math.floor(lockRemaining / 60)}:{String(lockRemaining % 60).padStart(2, '0')}
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
                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus:bg-white transition-all" 
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
                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus:bg-white transition-all" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading || lockRemaining > 0} 
              />
            </div>

            <Button 
              disabled={loading || lockRemaining > 0} 
              onClick={handleLogin} 
              className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/10 mt-2 hover:scale-[1.02] transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "دخول المنصة"}
            </Button>

            <div className="text-center pt-2">
              <Link href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`} className="text-xs text-muted-foreground font-bold hover:text-secondary transition-colors">
                نسيت كلمة المرور؟ تواصل معنا للمساعدة
              </Link>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-10">
            <div className="text-muted-foreground font-bold text-sm">
              ليس لديك حساب بعد؟ <Link href="/auth/register" className="text-secondary font-black hover:underline">إنشاء حساب جديد</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
