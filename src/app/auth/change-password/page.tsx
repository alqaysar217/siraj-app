
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { updatePassword, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Lock, AlertTriangle, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";

export default function ForceChangePasswordPage() {
  const { user, profile, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setNewConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // أمن: منع الطالب من الهروب إذا كان مطالباً بالتغيير
  useEffect(() => {
    if (!userLoading && !profile?.forcePasswordChange) {
       router.replace("/dashboard");
    }
  }, [profile, userLoading, router]);

  const handleUpdate = async () => {
    if (!auth?.currentUser || !db) return;

    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "كلمة سر ضعيفة", description: "يجب أن تكون 8 أحرف على الأقل." });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "عدم تطابق", description: "كلمتا المرور غير متطابقتين." });
      return;
    }

    if (newPassword === "student123") {
      toast({ variant: "destructive", title: "خطأ أمني", description: "لا يمكنك استخدام كلمة السر الافتراضية." });
      return;
    }

    setLoading(true);

    try {
      // 1. تحديث كلمة السر في Firebase Auth
      await updatePassword(auth.currentUser, newPassword);

      // 2. إزالة علامة الفرض من Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        forcePasswordChange: false
      });

      toast({ title: "تم التحديث بنجاح", description: "تم تأمين حسابك بكلمة سر جديدة." });
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        toast({ variant: "destructive", title: "انتهت الجلسة", description: "يرجى تسجيل الخروج والدخول مرة أخرى ثم تغيير كلمة السر." });
        setTimeout(() => signOut(auth).then(() => router.push("/auth/login")), 3000);
      } else {
        toast({ variant: "destructive", title: "فشل التحديث", description: "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) return <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md luxury-shadow border-none rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-xl">
          <div className="h-2 bg-gradient-to-l from-primary via-secondary to-primary opacity-80" />
          
          <CardHeader className="text-center pt-10 pb-6">
            <div className="mx-auto w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black font-headline text-primary">تأمين الحساب</CardTitle>
            <CardDescription className="font-bold text-red-600 flex items-center justify-center gap-2 mt-2 bg-red-50 py-2 rounded-xl mx-4">
               <AlertTriangle className="w-4 h-4" /> إجراء إلزامي: تعيين كلمة سر جديدة
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10 text-right">
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
               لحماية حسابك ومحتواك التعليمي، يجب عليك تغيير كلمة السر الحالية قبل المتابعة لتصفح المنصة.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-black text-primary flex items-center gap-2 mr-1">
                  <Lock className="w-4 h-4 text-secondary" /> كلمة المرور الجديدة
                </Label>
                <Input 
                  type="password" 
                  placeholder="8 أحرف أو أرقام على الأقل" 
                  className="h-14 rounded-2xl bg-muted/20 border-primary/5 focus:bg-white" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black text-primary flex items-center gap-2 mr-1">
                  <KeyRound className="w-4 h-4 text-secondary" /> تأكيد كلمة المرور
                </Label>
                <Input 
                  type="password" 
                  placeholder="أعد كتابة كلمة السر" 
                  className="h-14 rounded-2xl bg-muted/20 border-primary/5 focus:bg-white" 
                  value={confirmPassword}
                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button 
              disabled={loading || !newPassword || newPassword !== confirmPassword} 
              onClick={handleUpdate}
              className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "تأمين الحساب والمتابعة"}
            </Button>
            
            <button 
               onClick={() => signOut(auth).then(() => router.push("/auth/login"))}
               className="w-full text-xs text-muted-foreground font-bold hover:text-red-500 transition-colors"
            >
               إلغاء وتسجيل الخروج
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
