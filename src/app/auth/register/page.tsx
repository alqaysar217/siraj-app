
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import { useAuth, useFirestore } from "@/firebase/provider";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const getStableDeviceID = () => {
    if (typeof window === 'undefined') return "unknown";
    const ua = navigator.userAgent;
    let os = "Web";
    if (/android/i.test(ua)) os = "Android";
    else if (/iPad|iPhone|iPod/.test(ua)) os = "iOS";
    else if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "MacOS";
    
    const screenWidth = window.screen?.width || 0;
    const screenHeight = window.screen?.height || 0;
    return `${os}-${screenWidth}x${screenHeight}`;
  };

  const handleRegister = async () => {
    if (!auth || !db) return;

    if (!name || !email || !password) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
      return;
    }

    if (password.length < 8) {
      toast({ variant: "destructive", title: "كلمة سر ضعيفة", description: "يجب أن تكون 8 أحرف على الأقل." });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password.trim());
      const user = userCredential.user;

      const deviceId = getStableDeviceID();
      const sessionId = `sess_${Date.now()}`;
      
      const profileData = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "student",
        status: "active",
        enrolledCourses: [],
        showInLeaderboard: true,
        lastSessionId: sessionId,
        deviceIds: [deviceId],
        createdAt: serverTimestamp()
      };

      // التأكد من نجاح كتابة الملف قبل المتابعة
      await setDoc(doc(db, "users", user.uid), profileData);
      
      localStorage.setItem('siraj_session_id', sessionId);
      setSuccess(true);
      
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1500);

    } catch (error: any) {
      console.error("Register error:", error);
      let msg = "حدث خطأ غير متوقع.";
      if (error.code === "auth/email-already-in-use") msg = "هذا البريد مسجل مسبقاً لدينا.";
      toast({ variant: "destructive", title: "فشل التسجيل", description: msg });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md luxury-shadow border-none rounded-[2.5rem] text-center p-10 bg-white">
            <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">تم الانضمام! 🎉</CardTitle>
            <p className="font-bold mt-2 text-muted-foreground">جاري تحويلك لمساحتك التعليمية...</p>
            <div className="mt-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-secondary" /></div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md luxury-shadow border-primary/5 rounded-[2.5rem] bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-10">
            <div className="mx-auto w-14 h-14 relative mb-4">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">حساب جديد</CardTitle>
            <CardDescription className="font-bold text-muted-foreground">استثمر في مستقبلك اليوم</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 mr-1"><User className="w-4 h-4 text-secondary" /> الاسم الكامل</Label>
              <Input placeholder="مثال: محمود الحساني" className="h-14 rounded-2xl bg-muted/40 border-primary/5 px-6" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 mr-1"><Mail className="w-4 h-4 text-secondary" /> البريد الإلكتروني</Label>
              <Input type="email" placeholder="example@gmail.com" className="h-14 rounded-2xl bg-muted/40 border-primary/5 px-6" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2 mr-1"><Lock className="w-4 h-4 text-secondary" /> كلمة المرور</Label>
              <Input type="password" placeholder="••••••••" className="h-14 rounded-2xl bg-muted/40 border-primary/5 px-6" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            </div>
            <Button disabled={loading} onClick={handleRegister} className="w-full h-14 rounded-2xl bg-secondary text-white font-black text-xl shadow-xl mt-4">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "تأكيد الانضمام"}
            </Button>
          </CardContent>
          <CardFooter className="justify-center pb-10">
            <div className="text-muted-foreground font-bold text-sm">لديك حساب؟ <Link href="/auth/login" className="text-primary font-black hover:underline">دخول</Link></div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
