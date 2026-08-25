
'use client';

import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Loader2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Languages,
  MapPin,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { useUser, useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MyCertificateDataPage() {
  const { user, profile, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [saving, setSaving] = useState<string | null>(null);

  // جلب الدورات المشترك فيها
  const enrolledIds = profile?.enrolledCourses || [];
  const coursesQuery = useMemoFirebase(() => {
    if (!db || enrolledIds.length === 0) return null;
    return query(collection(db, "courses"), where("__name__", "in", enrolledIds));
  }, [db, enrolledIds.join(',')]);
  const { data: courses, loading: coursesLoading } = useCollection(coursesQuery);

  // جلب السجلات المدخلة مسبقاً لهذا المستخدم
  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "certificate_claims"), where("userId", "==", user.uid));
  }, [db, user]);
  const { data: claims } = useCollection(claimsQuery);

  // حالة الفورم المحلي
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSave = async (courseId: string, courseTitle: string) => {
    if (!db || !user) return;
    
    const data = formData[courseId];
    if (!data?.nameAr || !data?.nameEn || !data?.address) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة الحقول لهذا الكورس." });
      return;
    }

    setSaving(courseId);
    try {
      const claimId = `${user.uid}_${courseId}`;
      await setDoc(doc(db, "certificate_claims", claimId), {
        userId: user.uid,
        userEmail: user.email,
        courseId,
        courseTitle,
        nameAr: data.nameAr.trim(),
        nameEn: data.nameEn.trim(),
        address: data.address.trim(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "تم الحفظ", description: "تم تحديث بياناتك بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ البيانات." });
    } finally {
      setSaving(null);
    }
  };

  if (userLoading || (enrolledIds.length > 0 && coursesLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="mb-10 text-right space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary text-white rounded-2xl shadow-xl">
                <FileText className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-black font-headline text-primary">بيانات الشهادة والتوثيق</h1>
          </div>
          <p className="text-muted-foreground font-bold leading-relaxed pr-1">
             أدخل اسمك الرباعي بدقة كما تريده أن يظهر في الشهادة المعتمدة وعنوان استلام النسخة الورقية.
          </p>
        </header>

        {enrolledIds.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-[2.5rem] border-2 border-dashed border-primary/10">
             <AlertCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-primary">لا توجد دورات مفعلة حالياً</h3>
             <p className="text-muted-foreground mt-2">اشترك في دورة أولاً لتتمكن من إدخال بيانات التوثيق.</p>
             <Button asChild className="mt-6 bg-primary rounded-xl">
               <Link href="/courses">تصفح الدورات</Link>
             </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {courses?.map((course: any) => {
              const claim = claims?.find(c => c.courseId === course.id);
              const localData = formData[course.id] || {
                nameAr: claim?.nameAr || "",
                nameEn: claim?.nameEn || "",
                address: claim?.address || ""
              };

              return (
                <Card key={course.id} className="luxury-shadow border-none rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
                   <div className="bg-muted/20 border-b p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-primary/5 shadow-sm">
                            <BookOpen className="w-6 h-6 text-secondary" />
                         </div>
                         <div className="text-right">
                            <h3 className="font-black text-primary leading-tight">{course.title}</h3>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1">تأكد من مطابقة الاسم للهوية الشخصية</p>
                         </div>
                      </div>
                      {claim && (
                        <Badge className="bg-green-100 text-green-700 border-none px-4 py-1 rounded-full font-black text-[10px] self-start md:self-center">
                           <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" /> تمت إضافة البيانات
                        </Badge>
                      )}
                   </div>

                   <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2 text-right">
                            <Label className="font-black text-primary text-xs mr-1 flex items-center gap-1.5">
                               <Languages className="w-3.5 h-3.5 text-secondary" /> الاسم الرباعي (بالعربية)
                            </Label>
                            <Input 
                               placeholder="مثال: محمود محمد سعيد الحساني" 
                               value={localData.nameAr}
                               onChange={(e) => setFormData({...formData, [course.id]: {...localData, nameAr: e.target.value}})}
                               className="h-12 rounded-xl border-primary/5 bg-muted/10 text-right font-bold"
                            />
                         </div>
                         <div className="space-y-2 text-right">
                            <Label className="font-black text-primary text-xs mr-1 flex items-center gap-1.5">
                               <Languages className="w-3.5 h-3.5 text-secondary" /> Full Name (In English)
                            </Label>
                            <Input 
                               dir="ltr"
                               placeholder="e.g. Mahmoud Mohammed Saeed Al-Hassani" 
                               value={localData.nameEn}
                               onChange={(e) => setFormData({...formData, [course.id]: {...localData, nameEn: e.target.value}})}
                               className="h-12 rounded-xl border-primary/5 bg-muted/10 text-left font-bold"
                            />
                         </div>
                      </div>

                      <div className="space-y-2 text-right">
                         <Label className="font-black text-primary text-xs mr-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-secondary" /> عنوان الاستلام بالتفصيل
                         </Label>
                         <Input 
                            placeholder="المدينة - الحي - أقرب معلم (مثال: المكلا - حي السلام - عمارة البركة)" 
                            value={localData.address}
                            onChange={(e) => setFormData({...formData, [course.id]: {...localData, address: e.target.value}})}
                            className="h-12 rounded-xl border-primary/5 bg-muted/10 text-right font-bold"
                         />
                      </div>

                      <div className="pt-4">
                         <Button 
                           disabled={saving === course.id}
                           onClick={() => handleSave(course.id, course.title)}
                           className={cn(
                             "w-full h-12 rounded-xl font-black gap-2 shadow-lg transition-all active:scale-95",
                             claim ? "bg-primary text-white" : "bg-secondary text-white"
                           )}
                         >
                            {saving === course.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {claim ? "تحديث البيانات المحفوظة" : "حفظ بيانات التوثيق"}
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              );
            })}
            
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
               <Info className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
               <div className="text-right space-y-1">
                  <p className="font-black text-amber-800 text-sm">تنبيه هام للطلاب</p>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                     هذه البيانات هي التي سيتم استخدامها في طباعة الشهادة الورقية والإلكترونية. الإدارة غير مسؤولة عن أي خطأ إملائي تقوم بإدخاله. يرجى مراجعة الأسماء جيداً قبل الحفظ.
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
