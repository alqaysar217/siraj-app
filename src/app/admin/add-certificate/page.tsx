
"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { 
  Loader2, 
  Save, 
  Award, 
  User, 
  BookOpen, 
  Hash, 
  Calendar,
  ShieldCheck,
  ArrowRight,
  Globe,
  Plus
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";

function AddCertificateForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const certId = searchParams.get("id");
  const { toast } = useToast();

  const coursesQuery = useMemoFirebase(() => db ? query(collection(db, "courses"), orderBy("createdAt", "desc")) : null, [db]);
  const { data: courses } = useCollection(coursesQuery);

  const [formData, setFormData] = useState({
    certificateId: "",
    studentNameAr: "",
    courseId: "",
    issueDate: new Date().toISOString().split('T')[0],
    baseUrl: "https://sira.vercel.app"
  });

  const [customUrl, setCustomUrl] = useState("");
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  useEffect(() => {
    async function fetchCert() {
      if (!db || !certId) return;
      setInitialLoading(true);
      try {
        const docRef = doc(db, "certificates", certId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            certificateId: data.certificateId || "",
            studentNameAr: data.studentNameAr || "",
            courseId: data.courseId || "",
            issueDate: data.issueDate || new Date().toISOString().split('T')[0],
            baseUrl: data.baseUrl || "https://sira.vercel.app"
          });
        }
      } catch (error) {
        // Error handling
      } finally {
        setInitialLoading(false);
      }
    }
    fetchCert();
  }, [db, certId]);

  const generateUniqueCertId = () => {
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SIRAJ-${year}-${randomPart}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.studentNameAr || !formData.courseId) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال اسم الطالب واختيار الدورة التدريبية." });
      return;
    }

    setLoading(true);
    const selectedCourse = courses?.find(c => c.id === formData.courseId);
    const finalCertId = certId ? formData.certificateId : generateUniqueCertId();
    const finalBaseUrl = showCustomUrlInput ? (customUrl || formData.baseUrl) : formData.baseUrl;

    const certData = {
      certificateId: finalCertId,
      studentNameAr: formData.studentNameAr,
      courseId: formData.courseId,
      courseTitle: selectedCourse?.title || "دورة غير معروفة",
      issueDate: formData.issueDate,
      baseUrl: finalBaseUrl,
      updatedAt: serverTimestamp()
    };

    try {
      if (certId) {
        await updateDoc(doc(db, "certificates", certId), certData);
      } else {
        await addDoc(collection(db, "certificates"), { ...certData, createdAt: serverTimestamp() });
      }
      router.push("/admin/certificates");
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ في الحفظ", description: "فشل تواصل الخادم." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl text-right" dir="rtl">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline text-primary">
          {certId ? "تعديل توثيق شهادة" : "توثيق شهادة إتمام جديدة"}
        </h1>
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/admin/certificates">
            <ArrowRight className="w-4 h-4" /> العودة للسجلات
          </Link>
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-xl flex items-center gap-2 text-primary">
              <Award className="w-5 h-5 text-secondary" /> معلومات التوثيق والباركود
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2 pr-1">
                  <User className="w-4 h-4 text-secondary" /> اسم الطالب الكامل
                </Label>
                <Input 
                  placeholder="اكتب اسم الطالب كما سيظهر في الشهادة..." 
                  value={formData.studentNameAr} 
                  onChange={(e) => setFormData({...formData, studentNameAr: e.target.value})}
                  className="h-14 rounded-2xl text-right bg-background border-primary/5 text-lg" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2 pr-1">
                  <Calendar className="w-4 h-4 text-secondary" /> تاريخ المنح
                </Label>
                <Input 
                  type="date" 
                  value={formData.issueDate} 
                  onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  className="h-14 rounded-2xl text-center bg-background border-primary/5" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold flex items-center gap-2 pr-1">
                <BookOpen className="w-4 h-4 text-secondary" /> الدورة التدريبية المكتملة
              </Label>
              <Select value={formData.courseId} onValueChange={(val) => setFormData({...formData, courseId: val})}>
                <SelectTrigger className="h-14 rounded-2xl bg-background border-primary/5" dir="rtl">
                  <SelectValue placeholder="اختر الدورة التي أتمها الطالب بنجاح..." />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t border-primary/5">
              <Label className="font-bold flex items-center gap-2 pr-1">
                <Globe className="w-4 h-4 text-secondary" /> نطاق الموقع (Domain) المعتمد للباركود
              </Label>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  {!showCustomUrlInput ? (
                    <Select value={formData.baseUrl} onValueChange={(val) => {
                      if (val === "custom") {
                        setShowCustomUrlInput(true);
                      } else {
                        setFormData({...formData, baseUrl: val});
                      }
                    }}>
                      <SelectTrigger className="h-12 rounded-xl bg-background" dir="ltr">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="ltr">
                        <SelectItem value="https://sira.vercel.app">https://sira.vercel.app (الأساسي)</SelectItem>
                        <SelectItem value="custom">إضافة رابط موقع جديد...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://your-new-domain.com" 
                        value={customUrl} 
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="h-12 rounded-xl bg-background"
                        dir="ltr"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setShowCustomUrlInput(false)} className="h-12 w-12 rounded-xl">
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-bold leading-relaxed pr-1">
                * الباركود سيُبنى باستخدام هذا النطاق. الرابط الافتراضي هو موقعك الرسمي على فيرسل.
              </p>
            </div>

            {certId && (
              <div className="bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-secondary" />
                  <span className="font-bold text-primary">رقم التوثيق الحالي:</span>
                </div>
                <code className="text-lg font-black text-secondary font-mono">{formData.certificateId}</code>
              </div>
            )}
          </CardContent>
        </Card>

        <Button disabled={loading} type="submit" className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-black text-xl gap-3 shadow-xl shadow-primary/10 transition-all hover:scale-[1.01]">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
          {certId ? "حفظ التعديلات" : "توثيق الشهادة وإصدار الرقم والباركود"}
        </Button>
      </form>
    </div>
  );
}

export default function AddCertificatePage() {
  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>}>
        <AddCertificateForm />
      </Suspense>
    </div>
  );
}
