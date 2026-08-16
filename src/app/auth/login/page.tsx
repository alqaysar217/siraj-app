
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
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "+967735952927";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
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

  const handleLogin = async () => {
    if (!auth || !db) return;

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

        // استخدام setDoc مع merge بدلاً من updateDoc لتجنب أخطاء الصلاحيات
        await setDoc(userDocRef, { 
          lastSessionId: newSessionId, 
          deviceIds: Array.from(new Set([...currentDevices, deviceId])),
          updatedAt: serverTimestamp()
        }, { merge: true });

        localStorage.setItem('siraj_session_id', newSessionId);
        
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1000);

      } else {
        // حالة الترميم التلقائي إذا كان الحساب موجوداً في Auth ولكن ليس في Firestore
        const sessionId = `sess_${Date.now()}`;
        await setDoc(userDocRef, { 
          uid: user.uid,
          email: user.email,
          name: user.displayName || "طالب سراج",
          role: "student",
          status: "active",
          lastSessionId: sessionId,
          deviceIds: [deviceId],
          enrolledCourses: [],
          showInLeaderboard: true,
          createdAt: serverTimestamp()
        }, { merge: true });
        
        localStorage.setItem('siraj_session_id', sessionId);
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let msg = "البريد أو كلمة السر غير صحيحة.";
      if (error.code === 'auth/user-not-found') msg = "هذا الحساب غير موجود.";
      if (error.code === 'auth/wrong-password') msg = "كلمة المرور غير صحيحة.";
      
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
            <CardDescription className="font-bold text-muted-foreground">منصة سراج التعليمية</CardDescription>
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
              disabled={loading} 
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
