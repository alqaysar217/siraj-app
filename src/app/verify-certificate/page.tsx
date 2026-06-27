
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
  BadgeCheck
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
        }, 1200);
      } else {
        setError("لم يتم العثور على سجل لهذه الشهادة في قاعدة بياناتنا. يرجى التأكد من الرقم.");
        setLoading(false);
      }
    } catch (err) {
      setError("حدث خطأ أثناء محاولة التحقق. يرجى المحاولة لاحقاً.");
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
        
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 15, 
            qrbox: { width: 220, height: 220 },
            videoConstraints: { facingMode: "environment" },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render((decodedText: string) => {
          let finalId = decodedText;
          if (decodedText.includes("?id=")) {
            finalId = decodedText.split("?id=")[1];
          }
          
          setSearchTerm(finalId);
          setIsScanning(false);
          scanner.clear();
          handleVerify(undefined, finalId);
        }, (error: any) => {});
      };

      loadScanner();
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [isScanning]);

  const resetSearch = () => {
    setCertificate(null);
    setError(null);
    setSearchTerm("");
    router.replace("/verify-certificate");
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
          <p className="text-muted-foreground font-bold">نتحقق من سجلات التوثيق المعتمدة لمنصة سراج</p>
        </div>
      </div>
    );
  }

  if (certificate) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 pb-10">
        <header className="text-center space-y-4">
           <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner luxury-shadow border-4 border-white">
              <CheckCircle2 className="w-12 h-12" />
           </div>
           <h2 className="text-3xl font-black text-primary font-headline">إفادة توثيق رسمية</h2>
        </header>

        <Card className="rounded-[2.5rem] border-none luxury-shadow overflow-hidden bg-white relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-l from-secondary via-primary to-secondary opacity-80" />
          
          <CardContent className="p-6 md:p-10 space-y-8">
            <div className="bg-muted/30 p-6 md:p-10 rounded-[2rem] border border-primary/5 text-center relative overflow-hidden">
               <ShieldCheck className="absolute -bottom-10 -right-10 w-40 h-40 text-primary/5 -rotate-12" />
               <p className="text-lg md:text-xl leading-[2] text-primary font-medium relative z-10">
                  "تتقدم منصة سراج بتقديم شهادة اتمام للطالب /ة <br className="hidden md:block" />
                  <span className="font-black text-secondary text-2xl md:text-3xl block my-2 drop-shadow-sm">{certificate.studentNameAr}</span> 
                  لاتمامه دورة <br className="hidden md:block" />
                  <span className="font-black text-secondary text-xl md:text-2xl block my-2">{certificate.courseTitle}</span> 
                  في تاريخ <span className="font-black underline decoration-secondary/30 underline-offset-4" dir="ltr">{certificate.issueDate}</span> <br />
                  وتؤكد منصة سراج بأن هذه الشهادة أصلية ومعتمدة وموثقة في سجلاتنا الرقمية."
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-primary/5 rounded-2xl border border-primary/5 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-secondary shadow-sm"><Hash className="w-4 h-4" /></div>
                  <div>
                     <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">رقم التوثيق</p>
                     <p className="text-[10px] md:text-xs font-black text-primary truncate max-w-[120px]">{certificate.certificateId}</p>
                  </div>
               </div>
               
               <div className="p-4 bg-primary/5 rounded-2xl border border-primary/5 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-secondary shadow-sm"><Calendar className="w-4 h-4" /></div>
                  <div>
                     <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">تاريخ الإصدار</p>
                     <p className="text-[10px] md:text-xs font-black text-primary">{certificate.issueDate}</p>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col items-center gap-3 pt-4 border-t border-primary/5">
               <div className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-[10px] font-black shadow-xl shadow-primary/10">
                  <BadgeCheck className="w-4 h-4 text-secondary" /> تم التحقق بنجاح من قاعدة البيانات
               </div>
               <p className="text-[9px] text-muted-foreground font-bold">هذه الوثيقة صادرة إلكترونياً ولا تتطلب توقيعاً حياً</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-2">
          <Button onClick={resetSearch} variant="ghost" className="text-secondary font-black gap-2 hover:bg-secondary/5 h-12 px-8 rounded-2xl">
             <RotateCcw className="w-5 h-5" /> فحص شهادة أخرى
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl text-center" dir="rtl">
      <div className="mb-10 md:mb-16 space-y-6 animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 luxury-shadow border border-primary/5">
           <ShieldCheck className="w-10 h-10 text-secondary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black font-headline text-primary">التحقق من الشهادات</h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto font-medium">
            نظام التوثيق الرقمي المعتمد لطلاب منصة سراج التعليمية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
        <Card className="rounded-[2.5rem] border-none luxury-shadow bg-white/80 backdrop-blur-sm group hover:bg-white transition-all border-2 border-transparent hover:border-primary/5">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3 text-right">
              <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Hash className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-primary font-headline">رقم التوثيق</h3>
            </div>
            <form onSubmit={(e) => handleVerify(e)} className="space-y-4">
              <div className="relative">
                <Input 
                  placeholder="مثال: SIRAJ-2024-XXXX" 
                  className="h-14 pr-12 text-right rounded-2xl border-primary/10 bg-muted/20 font-black text-primary placeholder:text-muted-foreground/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button 
                disabled={!searchTerm.trim()} 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg hover:bg-primary/90 shadow-xl shadow-primary/10 transition-transform active:scale-95"
              >
                فحص السجل الرقمي
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card 
          className="rounded-[2.5rem] border-none luxury-shadow bg-white/80 backdrop-blur-sm overflow-hidden group hover:bg-white transition-all cursor-pointer border-2 border-transparent hover:border-secondary/20" 
          onClick={() => setIsScanning(true)}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6 h-full">
            <div className="w-20 h-20 bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all duration-500 shadow-inner">
              <QrCode className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-primary font-headline">مسح الباركود</h3>
              <p className="text-sm text-muted-foreground font-bold">استخدم الكاميرا للمسح المباشر والسريع</p>
            </div>
            <div className="flex items-center gap-2 text-secondary font-black text-xs bg-secondary/5 px-4 py-1.5 rounded-full">
              فتح الكاميرا الآن
              <ChevronLeft className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isScanning} onOpenChange={setIsScanning}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none luxury-shadow [&>button]:hidden" dir="rtl">
          <DialogHeader className="p-8 bg-muted/30 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-black text-primary font-headline flex items-center gap-3">
              <div className="p-2 bg-secondary text-white rounded-xl shadow-md"><ScanLine className="w-6 h-6" /></div>
              مسح الباركود
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsScanning(false)} className="rounded-full h-12 w-12 hover:bg-primary/5 text-primary">
              <X className="w-6 h-6" />
            </Button>
          </DialogHeader>
          <div className="p-8 space-y-8">
            <div id="qr-reader" className="overflow-hidden rounded-[2rem] border-8 border-white bg-black/5 aspect-square relative flex items-center justify-center luxury-shadow" />
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-black">
                 <Camera className="w-4 h-4" /> جاري تهيئة الكاميرا
              </div>
              <p className="text-base font-bold text-primary opacity-80">وجه الكاميرا نحو الكود المطبوع في الشهادة</p>
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
