
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
import { doc, setDoc } from "firebase/firestore";
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
  const { toast } = useToast();

  const getDeviceFingerprint = () => {
    if (typeof window === 'undefined') return "Unknown";
    let storedId = localStorage.getItem('siraj_device_token');
    if (!storedId) {
      storedId = `Device-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('siraj_device_token', storedId);
    }
    return storedId;
  };

  const validateEmail = (email: string) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleRegister = async () => {
    if (!auth || !db) return;

    if (!name || !email || !password) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة الحقول." });
      return;
    }

    if (!validateEmail(email)) {
      toast({ variant: "destructive", title: "خطأ في البريد", description: "صيغة البريد الإلكتروني غير صحيحة." });
      return;
    }

    if (password.length < 8) {
      toast({ variant: "destructive", title: "كلمة سر ضعيفة", description: "يجب أن تكون 8 أحرف على الأقل للأمان." });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password.trim());
      const user = userCredential.user;

      const deviceId = getDeviceFingerprint();
      const initialSessionId = `sess_${Date.now()}`;
      
      localStorage.setItem('siraj_session_id', initialSessionId);
      localStorage.setItem('siraj_session_timestamp', Date.now().toString());

      // الالتزام ببيانات متوافقة مع Security Rules لمنع الرفض
      const profileData = {
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: "",
        photoURL: "",
        role: "student",
        status: "active",
        enrolledCourses: [],
        showInLeaderboard: true,
        forcePasswordChange: false, 
        lastSessionId: initialSessionId,
        deviceIds: [deviceId],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), profileData);
      setSuccess(true);

    } catch (error: any) {
      let errorMessage = "حدث خطأ غير متوقع.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "هذا البريد الإلكتروني مسجل بالفعل.";
      }
      toast({ variant: "destructive", title: "فشل التسجيل", description: errorMessage });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md luxury-shadow border-none rounded-[2.5rem] text-center p-10 bg-white">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-black font-headline text-primary">تم الانضمام بنجاح! 🎉</CardTitle>
              <CardDescription className="font-bold text-lg">أهلاً بك {name} في أسرة سراج التعليمية</CardDescription>
            </CardHeader>
            <CardContent className="mt-4">
              <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl shadow-xl shadow-primary/10">
                <Link href="/dashboard">بدء رحلتي التعليمية</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md luxury-shadow border-primary/5 rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 pt-10">
            <div className="mx-auto w-14 h-14 relative mb-4 transition-transform hover:scale-110">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">إنشاء حساب جديد</CardTitle>
            <CardDescription className="font-bold">استثمر في مستقبلك العلمي اليوم</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2 text-right">
              <Label htmlFor="name" className="font-bold flex items-center gap-2 mr-1 mb-1">
                <User className="w-4 h-4 text-secondary" /> الاسم الكامل
              </Label>
              <Input id="name" placeholder="مثال: محمود الحساني" className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus:bg-white transition-all text-right" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="email" className="font-bold flex items-center gap-2 mr-1 mb-1">
                <Mail className="w-4 h-4 text-secondary" /> البريد الإلكتروني
              </Label>
              <Input id="email" type="email" placeholder="example@gmail.com" className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus:bg-white transition-all text-right" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="font-bold flex items-center gap-2 mr-1 mb-1">
                <Lock className="w-4 h-4 text-secondary" /> كلمة المرور
              </Label>
              <Input id="password" type="password" placeholder="••••••••" className="h-12 rounded-2xl bg-muted/30 border-primary/5 focus:bg-white transition-all text-right" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <Button disabled={loading || !auth} onClick={handleRegister} className="w-full h-14 rounded-2xl bg-secondary text-white hover:bg-secondary/90 font-black text-xl shadow-xl shadow-secondary/10 mt-4 transition-transform active:scale-95">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "تأكيد الانضمام الآن"}
            </Button>
          </CardContent>
          <CardFooter className="justify-center pb-10">
            <div className="text-muted-foreground font-bold text-sm">
              لديك حساب بالفعل؟{" "}
              <Link href="/auth/login" className="text-primary font-black hover:underline">تسجيل الدخول</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
