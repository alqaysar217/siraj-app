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
import { Loader2, MessageCircle, Mail, Lock, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "+967775258830";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // أمان الدخول (Rate Limiting)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0); // بالثواني
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // فحص حالة الحظر عند تحميل الصفحة
  useEffect(() => {
    const storedAttempts = parseInt(localStorage.getItem('login_attempts') || '0');
    const lockUntil = parseInt(localStorage.getItem('login_lock_until') || '0');
    const now = Date.now();

    setFailedAttempts(storedAttempts);

    if (lockUntil > now) {
      setLockRemaining(Math.ceil((lockUntil - now) / 1000));
    }
  }, []);

  // تحديث العداد التنازلي للحظر
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
    let deviceName = "جهاز غير معروف";
    
    if (/android/i.test(ua)) deviceName = "Android Device";
    else if (/iPad|iPhone|iPod/.test(ua)) deviceName = "iPhone/iPad";
    else if (/Windows/i.test(ua)) deviceName = "Windows PC";
    else if (/Mac/i.test(ua)) deviceName = "MacBook";
    else if (/Linux/i.test(ua)) deviceName = "Linux PC";

    let storedId = localStorage.getItem('siraj_device_token');
    if (!storedId) {
      storedId = `${deviceName}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('siraj_device_token', storedId);
    }
    return storedId;
  };

  const handleLogin = async () => {
    if (!auth || !db) return;
    
    // فحص الحظر قبل المحاولة
    if (lockRemaining > 0) {
      toast({ 
        variant: "destructive", 
        title: "تنبيه أمني", 
        description: `لقد تجاوزت عدد المحاولات المسموحة. يرجى الانتظار ${Math.floor(lockRemaining / 60)} دقيقة و ${lockRemaining % 60} ثانية.` 
      });
      return;
    }

    if (!email || !password) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال البريد وكلمة المرور." });
      return;
    }

    setLoading(true);
    localStorage.removeItem('siraj_session_id');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        if (userData.status === 'banned') {
          await signOut(auth);
          toast({
            variant: "destructive",
            duration: 10000,
            title: "تنبيه أمني: الحساب محظور",
            description: "نأسف، لقد تم حظر وصولك للمنصة لمخالفة الشروط. يرجى التواصل مع الإدارة للتوضيح.",
            action: (
              <Button variant="outline" size="sm" asChild className="border-white/20 bg-white/10 font-bold">
                <a href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=أهلاً محمود، حسابي (${email}) يظهر أنه محظور. يرجى مراجعة الحالة.`}>
                  <MessageCircle className="w-4 h-4" /> مراسلة الإدارة
                </a>
              </Button>
            )
          });
          setLoading(false);
          return;
        }

        if (userData.role === 'student') {
          const deviceId = getDeviceFingerprint();
          const registeredDevices = userData.deviceIds || [];
          const isKnownDevice = registeredDevices.includes(deviceId);
          
          if (registeredDevices.length >= 2 && !isKnownDevice) {
            await signOut(auth);
            toast({
              variant: "destructive",
              duration: 10000,
              title: "عذراً: تم تجاوز حد الأجهزة",
              description: `هذا الحساب مسجل مسبقاً على جهازين مختلفين. لطلب تصفير الأجهزة، تواصل مع الإدارة.`,
              action: (
                <Button variant="outline" size="sm" asChild className="border-white/20 bg-white/10 font-bold">
                  <a href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=أهلاً محمود، تعذر الدخول للحساب ${email} بسبب تجاوز حد الأجهزة (2/2). يرجى تصفير أجهزتي.`}>
                    <MessageCircle className="w-4 h-4" /> مراسلة الإدارة
                  </a>
                </Button>
              )
            });
            setLoading(false);
            return;
          }

          const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          localStorage.setItem('siraj_session_id', newSessionId);
          
          await updateDoc(userDocRef, {
            lastSessionId: newSessionId,
            deviceIds: arrayUnion(deviceId)
          });
        }
      }

      // عند النجاح: صفر عداد المحاولات الخاطئة
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lock_until');
      
      toast({ title: "تم تسجيل الدخول", description: "مرحباً بك مجدداً في بيئة سراج التعليمية." });
      router.push("/dashboard");
    } catch (error: any) {
      // عند الفشل: زد عداد المحاولات
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      if (newAttempts >= 5) {
        // حساب مدة الحظر: 2 دقيقة للمرة الخامسة، ثم 3 دقائق، ثم 4..
        const extraMinutes = newAttempts - 5;
        const lockMinutes = 2 + extraMinutes;
        const lockUntil = Date.now() + (lockMinutes * 60 * 1000);
        
        localStorage.setItem('login_lock_until', lockUntil.toString());
        setLockRemaining(lockMinutes * 60);

        toast({ 
          variant: "destructive", 
          title: "تنبيه أمان", 
          description: `تم حظر محاولات الدخول من هذا الجهاز لمدة ${lockMinutes} دقائق لحماية الحساب.` 
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: "فشل الدخول", 
          description: `البريد أو كلمة المرور غير صحيحة. متبقي لك ${5 - newAttempts} محاولات قبل الحظر المؤقت.` 
        });
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md luxury-shadow border-primary/5 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-2 text-center pb-6 pt-10">
            <div className="mx-auto w-14 h-14 relative mb-4 transition-transform hover:scale-110">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">تسجيل الدخول</CardTitle>
            <CardDescription className="font-bold">مرحباً بك في بيئة التعلم الآمنة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            
            {lockRemaining > 0 && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-800 animate-pulse">
                <Clock className="w-5 h-5 shrink-0" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase">الجهاز محظور مؤقتاً</p>
                  <p className="text-xs font-bold">يرجى المحاولة بعد: {Math.floor(lockRemaining / 60)}:{String(lockRemaining % 60).padStart(2, '0')}</p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-right">
              <Label htmlFor="email" className="font-bold flex items-center gap-2 mr-1 mb-1">
                <Mail className="w-4 h-4 text-secondary" />
                البريد الإلكتروني
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="example@gmail.com" 
                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus:bg-white transition-all text-right" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || lockRemaining > 0}
              />
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="font-bold flex items-center gap-2 mr-1 mb-1">
                <Lock className="w-4 h-4 text-secondary" />
                كلمة المرور
              </Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus:bg-white transition-all text-right" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || lockRemaining > 0}
              />
            </div>

            <Button 
              disabled={loading || !auth || lockRemaining > 0}
              onClick={handleLogin}
              className="w-full h-14 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-xl shadow-xl shadow-primary/10 mt-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : lockRemaining > 0 ? "الجهاز مقفل" : "دخول المنصة"}
            </Button>

            <div className="text-center pt-2">
              <Link 
                href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=أهلاً محمود، لقد نسيت كلمة مرور حسابي (${email || '...'}). أرجو المساعدة في استعادتها.`} 
                className="text-xs text-muted-foreground font-bold hover:text-secondary transition-colors"
                target="_blank"
              >
                نسيت كلمة المرور؟ تواصل معنا عبر واتساب
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 text-center text-sm pb-10">
            <div className="text-muted-foreground font-bold">
              ليس لديك حساب بعد؟{" "}
              <Link href="/auth/register" className="text-secondary font-black hover:underline">
                إنشاء حساب جديد
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
