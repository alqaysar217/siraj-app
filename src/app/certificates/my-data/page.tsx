
'use client';

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Loader2, 
  Save, 
  Info,
  Languages,
  MapPin,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useUser, useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function MyCertificateDataPage() {
  const { user, profile, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [saving, setSaving] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const enrolledIds = profile?.enrolledCourses || [];
  const coursesQuery = useMemoFirebase(() => {
    if (!db || enrolledIds.length === 0) return null;
    return query(collection(db, "courses"), where("__name__", "in", enrolledIds));
  }, [db, enrolledIds.join(',')]);
  const { data: courses, loading: coursesLoading } = useCollection(coursesQuery);

  const claimsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "certificate_claims"), where("userId", "==", user.uid));
  }, [db, user]);
  const { data: claims } = useCollection(claimsQuery);

  const handleSave = async (courseId: string, courseTitle: string) => {
    if (!db || !user) return;
    
    const data = formData[courseId] || {
      nameAr: claims?.find(c => c.courseId === courseId)?.nameAr || "",
      nameEn: claims?.find(c => c.courseId === courseId)?.nameEn || "",
      address: claims?.find(c => c.courseId === courseId)?.address || ""
    };

    if (!data.nameAr || !data.nameEn || !data.address) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة الحقول (الاسم الرباعي عربي وإنجليزي والعنوان)." });
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
      toast({ title: "تم الحفظ بنجاح", description: "بيانات شهادتك جاهزة للاعتماد الآن." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ البيانات، حاول مجدداً." });
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-8 text-right space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-primary text-white rounded-2xl shadow-lg">
                <FileText className="w-6 h-6" />
             </div>
             <h1 className="text-2xl font-black font-headline text-primary">بيانات الشهادة</h1>
          </div>
          <p className="text-muted-foreground text-[10px] md:text-xs font-bold leading-relaxed pr-1 opacity-80">
             أدخل اسمك الرباعي بدقة كما تريده أن يظهر في الشهادة المعتمدة.
          </p>
        </header>

        {enrolledIds.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-[2rem] border-2 border-dashed border-primary/10">
             <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-primary">لا توجد دورات مفعلة</h3>
             <p className="text-xs text-muted-foreground mt-2">اشترك في دورة لتتمكن من إدخال بيانات التوثيق.</p>
             <Button asChild className="mt-6 bg-primary rounded-xl h-11 px-8 text-xs font-black">
               <Link href="/courses">تصفح الدورات</Link>
             </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {courses?.map((course: any) => {
              const claim = claims?.find(c => c.courseId === course.id);
              const localData = formData[course.id] || {
                nameAr: claim?.nameAr || "",
                nameEn: claim?.nameEn || "",
                address: claim?.address || ""
              };

              const updateLocalData = (field: string, val: string) => {
                setFormData(prev => ({
                  ...prev,
                  [course.id]: { ...localData, [field]: val }
                }));
              };

              return (
                <AccordionItem key={course.id} value={course.id} className="border-none">
                  <Card className="luxury-shadow border-none rounded-[1.5rem] overflow-hidden bg-white/90 backdrop-blur-sm">
                    <AccordionTrigger className="hover:no-underline p-5 md:p-6 text-right [&[data-state=open]>svg]:rotate-180">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/5 shadow-sm shrink-0">
                          <BookOpen className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="text-right">
                          <h3 className="font-black text-primary text-sm md:text-base leading-tight">{course.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {claim ? (
                              <Badge className="bg-green-100 text-green-700 border-none px-2 py-0 h-4 rounded font-black text-[8px]">
                                <UserCheck className="w-2.5 h-2.5 ml-1" /> البيانات محفوظة
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[8px] h-4 font-bold border-amber-200 text-amber-600 bg-amber-50">
                                بانتظار البيانات
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 md:p-8 pt-0 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1.5 text-right">
                            <Label className="font-black text-primary text-[10px] mr-1 flex items-center gap-1.5">
                               <Languages className="w-3.5 h-3.5 text-secondary" /> الاسم الرباعي عربي
                            </Label>
                            <Input 
                               placeholder="محمود عمر علي حساني" 
                               value={localData.nameAr}
                               onChange={(e) => updateLocalData('nameAr', e.target.value)}
                               className="h-12 rounded-xl border-primary/5 bg-muted/10 text-right font-bold text-sm focus:bg-white transition-colors"
                            />
                         </div>
                         <div className="space-y-1.5 text-right">
                            <Label className="font-black text-primary text-[10px] mr-1 flex items-center gap-1.5">
                               <Languages className="w-3.5 h-3.5 text-secondary" /> الاسم الرباعي انجليزية
                            </Label>
                            <Input 
                               dir="ltr"
                               placeholder="Mahmoud Omar Ali Hassani" 
                               value={localData.nameEn}
                               onChange={(e) => updateLocalData('nameEn', e.target.value)}
                               className="h-12 rounded-xl border-primary/5 bg-muted/10 text-left font-bold text-sm focus:bg-white transition-colors"
                            />
                         </div>
                      </div>

                      <div className="space-y-1.5 text-right">
                         <Label className="font-black text-primary text-[10px] mr-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-secondary" /> عنوان الاستلام بالتفصيل
                         </Label>
                         <Input 
                            placeholder="المكلا - حي السلام - صيدلية بن قيدون" 
                            value={localData.address}
                            onChange={(e) => updateLocalData('address', e.target.value)}
                            className="h-12 rounded-xl border-primary/5 bg-muted/10 text-right font-bold text-sm focus:bg-white transition-colors"
                         />
                      </div>

                      <div className="pt-2">
                         <Button 
                           disabled={saving === course.id}
                           onClick={() => handleSave(course.id, course.title)}
                           className={cn(
                             "w-full h-12 rounded-xl font-black text-xs gap-2 shadow-lg transition-all active:scale-95",
                             claim ? "bg-primary text-white" : "bg-secondary text-white"
                           )}
                         >
                            {saving === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {claim ? "تحديث البيانات" : "حفظ وإرسال البيانات"}
                         </Button>
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <div className="bg-amber-50 p-5 rounded-[1.5rem] border border-amber-100 flex items-start gap-3 mt-8">
           <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
           <div className="text-right space-y-1">
              <p className="font-black text-amber-800 text-xs">تنبيه هام</p>
              <p className="text-[10px] text-amber-700 leading-relaxed font-bold opacity-90">
                 الأسماء التي تدخلها هنا هي التي ستطبع على الشهادة الورقية والرقمية. يرجى التأكد منها جيداً قبل الحفظ.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
