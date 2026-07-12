
"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Calendar,
  Hash,
  Camera,
  X,
  ScanLine,
  ChevronLeft,
  RotateCcw,
  BadgeCheck,
  Trophy,
  Star,
  Zap
} from "lucide-react";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function VerificationContent() {
  const db = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("id") || "";

  const [searchTerm, setSearchTerm] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleVerify = async (e?: React.FormEvent, customId?: string) => {
    e?.preventDefault();
    const idToVerify = (customId || searchTerm).trim();
    if (!db || !idToVerify) return;

    setLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const q = query(
        collection(db, "certificates"), 
        where("certificateId", "==", idToVerify),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setTimeout(() => {
          setCertificate(querySnapshot.docs[0].data());
          setLoading(false);
        }, 1500);
      } else {
        setError("رقم التوثيق غير صحيح أو لم يصدر بعد. يرجى التأكد من الرمز.");
        setLoading(false);
      }
    } catch (err) {
      setError("حدث خطأ تقني أثناء الفحص. يرجى المحاولة لاحقاً.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId && db) {
      handleVerify(undefined, initialId);
    }
  }, [initialId, db]);

  useEffect(() => {
    let scanner: any = null;
    if (isScanning && typeof window !== 'undefined') {
      const loadScanner = async () => {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        scanner = new Html5QrcodeScanner("qr-reader", { 
          fps: 15, 
          qrbox: 220, 
          aspectRatio: 1.0,
          videoConstraints: { facingMode: "environment" }
        }, false);
        scanner.render((decodedText: string) => {
          let finalId = decodedText;
          if (decodedText.includes("?id=")) finalId = decodedText.split("?id=")[1];
          setSearchTerm(finalId);
          setIsScanning(false);
          scanner.clear();
          handleVerify(undefined, finalId);
        }, () => {});
      };
      loadScanner();
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [isScanning]);

  const getGradeArabic = (grade: string) => {
    const grades: Record<string, string> = {
      excellent: "ممتاز جداً",
      very_good: "جيد جداً",
      good: "جيد",
      pass: "مقبول"
    };
    return grades[grade] || grade;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-primary/10 border-t-secondary animate-spin" />
          <ShieldCheck className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-primary animate-pulse font-headline">جاري الفحص الرقمي...</h2>
          <p className="text-muted-foreground font-bold">نتحقق من السجلات الرسمية لمنصة سراج</p>
        </div>
      </div>
    );
  }

  if (certificate) {
    const isExcellence = certificate.certificateType === 'excellence';
    
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-700 pb-10 px-4">
        <header className="text-center space-y-4 pt-4">
           <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto shadow-inner luxury-shadow border-4 border-white", isExcellence ? "bg-secondary text-white" : "bg-green-50 text-green-600")}>
              {isExcellence ? <Trophy className="w-8 h-8 md:w-12 md:h-12" /> : <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" />}
           </div>
           <h2 className="text-xl md:text-3xl font-black text-primary font-headline uppercase tracking-tight">إفادة توثيق رقمية معتمدة</h2>
        </header>

        <Card className="rounded-[2.5rem] md:rounded-[3rem] border-none luxury-shadow overflow-hidden bg-white relative">
          <div className={cn("absolute top-0 left-0 right-0 h-2 opacity-80", isExcellence ? "bg-gradient-to-l from-secondary via-yellow-400 to-secondary" : "bg-gradient-to-l from-primary via-secondary to-primary")} />
          
          <CardContent className="p-6 md:p-14 space-y-8">
            <div className="bg-muted/30 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-primary/5 text-center relative overflow-hidden">
               <ShieldCheck className="absolute -bottom-10 -right-10 w-32 h-28 md:w-56 md:h-48 text-primary/5 -rotate-12" />
               
               <div className="space-y-6 md:space-y-8 relative z-10">
                 {isExcellence ? (
                   <div className="text-sm md:text-xl leading-loose md:leading-[2.2] text-primary font-medium">
                      "تمنح منصة سراج التعليمية <span className="text-secondary font-black">وسام التفوق العلمي</span> للطالب/ة: <br />
                      <span className="font-black text-secondary text-2xl md:text-4xl block my-4 md:my-6 drop-shadow-sm">{certificate.studentNameAr}</span> 
                      تقديراً لتميزه/ا الاستثنائي في الدورة التدريبية: <br />
                      <span className="font-black text-primary text-xl md:text-3xl block my-3 md:my-4">{certificate.courseTitle}</span> 
                      حيث أظهر/ت كفاءة فائقة في إنهاء المنهج واجتياز التطبيقات العملية بتقدير <span className="text-secondary font-black">{getGradeArabic(certificate.grade)}</span> <br /> 
                      بتاريخ <span className="font-black underline decoration-secondary/30 underline-offset-4" dir="ltr">{certificate.issueDate}</span>."
                   </div>
                 ) : (
                   <div className="text-sm md:text-xl leading-loose md:leading-[2.2] text-primary font-medium">
                      "تشهد منصة سراج التعليمية بأن الطالب/ة: <br />
                      <span className="font-black text-secondary text-2xl md:text-4xl block my-4 md:my-6 drop-shadow-sm">{certificate.studentNameAr}</span> 
                      قد أتم/ت بنجاح كافة متطلبات الدورة التدريبية: <br />
                      <span className="font-black text-primary text-xl md:text-3xl block my-3 md:my-4">{certificate.courseTitle}</span> 
                      بما في ذلك مشاهدة المحاضرات واجتياز الاختبارات التقويمية بتقدير <span className="text-secondary font-black">{getGradeArabic(certificate.grade)}</span> <br /> 
                      بتاريخ <span className="font-black underline decoration-secondary/30 underline-offset-4" dir="ltr">{certificate.issueDate}</span>."
                   </div>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 md:p-6 bg-primary/5 rounded-3xl border border-primary/5 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center text-secondary shadow-sm"><Hash className="w-4 h-4 md:w-5 md:h-5" /></div>
                  <div>
                     <p className="text-[8px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">رقم السجل الرقمي</p>
                     <p className="text-[10px] md:text-sm font-black text-primary truncate max-w-[120px]">{certificate.certificateId}</p>
                  </div>
               </div>
               <div className="p-4 md:p-6 bg-primary/5 rounded-3xl border border-primary/5 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center text-secondary shadow-sm"><Star className="w-4 h-4 md:w-5 md:h-5" /></div>
                  <div>
                     <p className="text-[8px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">التقدير العام الممنوح</p>
                     <p className="text-[10px] md:text-sm font-black text-primary">{getGradeArabic(certificate.grade)}</p>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col items-center gap-4 pt-8 border-t border-primary/5">
               <div className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-full text-[10px] md:text-xs font-black shadow-2xl">
                  <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-secondary" /> سجل رقمي موثق ومعتمد رسمياً
               </div>
               <p className="text-[9px] md:text-[11px] text-muted-foreground font-bold text-center leading-relaxed">تعتبر هذه الوثيقة رسمية وصادرة إلكترونياً من نظام التوثيق الذكي في منصة سراج</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button onClick={() => { setCertificate(null); setSearchTerm(""); router.replace("/verify-certificate"); }} variant="ghost" className="text-secondary font-black gap-2 hover:bg-secondary/5 h-12 px-8 rounded-2xl">
             <RotateCcw className="w-5 h-5" /> فحص وثيقة أخرى
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-20 max-w-4xl text-center" dir="rtl">
      <div className="mb-12 md:mb-20 space-y-6 animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 luxury-shadow border border-primary/5">
           <ShieldCheck className="w-12 h-12 text-secondary" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl md:text-6xl font-black font-headline text-primary tracking-tight">نظام التحقق الرقمي</h1>
          <p className="text-muted-foreground text-sm md:text-xl max-w-xl mx-auto font-medium">
            تأكد من صحة الشهادات والأوسمة الصادرة لطلاب منصة سراج التعليمية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <Card className="rounded-[2.5rem] border-none luxury-shadow bg-white/80 backdrop-blur-sm group hover:bg-white transition-all border-2 border-transparent hover:border-primary/5">
          <CardContent className="p-10 space-y-8">
            <div className="flex items-center gap-4 text-right">
              <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <Hash className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-primary font-headline">رقم التوثيق</h3>
            </div>
            <form onSubmit={(e) => handleVerify(e)} className="space-y-5">
              <div className="relative">
                <Input 
                  placeholder="مثال: SIRAJ-2024-XXXX" 
                  className="h-16 pr-14 text-right rounded-2xl border-primary/10 bg-muted/20 font-black text-primary text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-6 h-6 absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button disabled={!searchTerm.trim()} type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xl shadow-xl hover:scale-[1.02] transition-transform">
                فحص السجل الرقمي
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none luxury-shadow bg-white/80 backdrop-blur-sm overflow-hidden group hover:bg-white transition-all cursor-pointer border-2 border-transparent hover:border-secondary/20" onClick={() => setIsScanning(true)}>
          <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-8 h-full">
            <div className="w-24 h-24 bg-secondary/10 rounded-[2rem] flex items-center justify-center text-secondary group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all duration-500 shadow-inner">
              <QrCode className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-primary font-headline">مسح الباركود</h3>
              <p className="text-base text-muted-foreground font-bold">استخدم الكاميرا للمسح المباشر والسريع</p>
            </div>
            <div className="flex items-center gap-3 text-secondary font-black text-sm bg-secondary/5 px-6 py-2.5 rounded-full shadow-sm">
              فتح الكاميرا الآن <ChevronLeft className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-12 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center justify-center gap-4 text-red-600 font-bold animate-in shake-1 shadow-sm">
          <AlertCircle className="w-6 h-6" /> {error}
        </div>
      )}

      <Dialog open={isScanning} onOpenChange={setIsScanning}>
        <DialogContent className="max-w-md rounded-[3rem] p-0 overflow-hidden border-none luxury-shadow [&>button]:hidden" dir="rtl">
          <DialogHeader className="p-8 bg-muted/30 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-black text-primary font-headline flex items-center gap-3">
              <div className="p-2.5 bg-secondary text-white rounded-xl shadow-md"><ScanLine className="w-6 h-6" /></div>
              مسح الباركود
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsScanning(false)} className="rounded-full h-12 w-12 hover:bg-primary/5 text-primary">
              <X className="w-7 h-7" />
            </Button>
          </DialogHeader>
          <div className="p-8 space-y-10">
            <div id="qr-reader" className="overflow-hidden rounded-[2.5rem] border-8 border-white bg-black/5 aspect-square relative flex items-center justify-center luxury-shadow" />
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-secondary/10 text-secondary rounded-full text-xs font-black">
                 <Camera className="w-4 h-4 animate-pulse" /> جاري تهيئة الكاميرا
              </div>
              <p className="text-lg font-bold text-primary opacity-80">وجه الكاميرا نحو الكود المطبوع في الشهادة</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-40" /></div>}>
        <VerificationContent />
      </Suspense>
    </div>
  );
}
