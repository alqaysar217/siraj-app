
'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  Download, 
  Loader2, 
  Users, 
  PlusCircle, 
  X, 
  UserPlus, 
  GraduationCap, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  Image as ImageIcon
} from "lucide-react";
import { useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, updateDoc, setDoc, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

/**
 * واجهة رصد درجات الواتساب الاحترافية
 */
function WhatsAppGradesContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");

  const [exerciseForm, setExerciseForm] = useState({ title: "", maxGrade: "10" });
  const [studentForm, setStudentForm] = useState({ name: "", gender: "male" });

  const coursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);
  const { data: courses } = useCollection(coursesQuery);

  const gradeDocRef = useMemoFirebase(() => 
    (db && selectedCourseId) ? doc(db, "whatsapp_grades", selectedCourseId) : null
  , [db, selectedCourseId]);
  const { data: gradeData, loading: gradeLoading } = useDoc(gradeDocRef);

  const exercises = gradeData?.exercises || [];
  const students = gradeData?.students || [];

  const handleAddExercise = async () => {
    if (!db || !selectedCourseId || !exerciseForm.title) return;
    const newEx = {
      id: "ex_" + Date.now(),
      title: exerciseForm.title,
      maxGrade: Number(exerciseForm.maxGrade) || 10
    };
    try {
      await setDoc(gradeDocRef!, { 
        exercises: arrayUnion(newEx),
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setIsExerciseModalOpen(false);
      setExerciseForm({ title: "", maxGrade: "10" });
      toast({ title: "تمت الإضافة", description: "تم إضافة تمرين جديد للجدول." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إضافة التمرين." });
    }
  };

  const handleAddStudent = async () => {
    if (!db || !selectedCourseId || !studentForm.name) return;
    const newStudent = {
      id: "st_" + Date.now(),
      name: studentForm.name,
      gender: studentForm.gender,
      grades: {}
    };
    try {
      await setDoc(gradeDocRef!, { 
        students: arrayUnion(newStudent),
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setIsStudentModalOpen(false);
      setStudentForm({ name: "", gender: "male" });
      toast({ title: "تم الانضمام", description: "تم إضافة الطالب لقائمة الرصد." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إضافة الطالب." });
    }
  };

  const updateGrade = async (studentId: string, exId: string, value: string) => {
    if (!db || !selectedCourseId) return;
    const updatedStudents = students.map((s: any) => {
      if (s.id === studentId) {
        return { ...s, grades: { ...s.grades, [exId]: value } };
      }
      return s;
    });
    try {
      await updateDoc(gradeDocRef!, { students: updatedStudents });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteExercise = async (ex: any) => {
    if (!db || !selectedCourseId) return;
    await updateDoc(gradeDocRef!, { exercises: arrayRemove(ex) });
  };

  const deleteStudent = async (st: any) => {
    if (!db || !selectedCourseId) return;
    await updateDoc(gradeDocRef!, { students: arrayRemove(st) });
  };

  const handleExport = async (targetGender: "male" | "female") => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setGenderFilter(targetGender);
    
    // تأخير بسيط لضمان تحديث الواجهة قبل الالتقاط
    setTimeout(async () => {
      try {
        const dataUrl = await toPng(exportRef.current!, { 
          cacheBust: true, 
          backgroundColor: '#F8F5EF',
          pixelRatio: 2
        });
        const link = document.createElement('a');
        link.download = `درجات_سراج_${targetGender === 'male' ? 'الشباب' : 'البنات'}_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: "تم التصدير بنجاح", description: "تم تحميل صورة الدرجات، جاهزة للإرسال عبر واتساب." });
      } catch (err) {
        toast({ variant: "destructive", title: "فشل التصدير", description: "حدث خطأ أثناء توليد الصورة." });
      } finally {
        setIsExporting(false);
        setGenderFilter("all");
      }
    }, 500);
  };

  const filteredStudents = useMemo(() => {
    if (genderFilter === "all") return students;
    return students.filter((s: any) => s.gender === genderFilter);
  }, [students, genderFilter]);

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl text-right" dir="rtl">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-black font-headline text-primary">رصد درجات الواتساب</h1>
        <p className="text-muted-foreground font-bold">أدر درجات الطلاب التقويمية وصدّرها كصور احترافية لمجموعات الواتساب.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
         <Card className="md:col-span-3 luxury-shadow border-none bg-card/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-6 flex flex-row items-center justify-between">
               <div className="flex items-center gap-4 flex-1">
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="h-12 rounded-xl bg-white border-primary/10 shadow-sm font-black w-full md:w-72" dir="rtl">
                      <SelectValue placeholder="اختر الدورة لبدء الرصد..." />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {courses?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
               {selectedCourseId && (
                 <div className="flex items-center gap-2">
                    <Button onClick={() => setIsExerciseModalOpen(true)} variant="outline" className="rounded-xl border-primary/10 gap-2 font-bold h-10 text-xs">
                       <PlusCircle className="w-4 h-4 text-secondary" /> أضف تمرين
                    </Button>
                    <Button onClick={() => setIsStudentModalOpen(true)} className="bg-primary text-white rounded-xl gap-2 font-bold h-10 text-xs">
                       <UserPlus className="w-4 h-4" /> أضف طالب
                    </Button>
                 </div>
               )}
            </CardHeader>
            <CardContent className="p-0">
               {!selectedCourseId ? (
                 <div className="py-24 text-center">
                    <GraduationCap className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold">يرجى اختيار دورة تعليمية أولاً لعرض جدول الرصد.</p>
                 </div>
               ) : gradeLoading ? (
                 <div className="py-24 text-center"><Loader2 className="w-10 h-10 animate-spin text-secondary mx-auto" /></div>
               ) : (
                 <div className="overflow-x-auto">
                    <Table className="text-right">
                       <TableHeader className="bg-muted/10">
                          <TableRow>
                             <TableHead className="text-right font-black py-4 w-48">اسم الطالب</TableHead>
                             <TableHead className="text-center font-black py-4">الجنس</TableHead>
                             {exercises.map((ex: any) => (
                               <TableHead key={ex.id} className="text-center font-black py-4 min-w-[100px]">
                                  <div className="flex flex-col items-center">
                                     <span className="text-[10px] md:text-xs">{ex.title}</span>
                                     <span className="text-[8px] opacity-50">من {ex.maxGrade}</span>
                                     <button onClick={() => deleteExercise(ex)} className="mt-1 text-destructive opacity-0 hover:opacity-100"><X className="w-3 h-3" /></button>
                                  </div>
                               </TableHead>
                             ))}
                             <TableHead className="text-center font-black py-4 w-10"></TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {students.length > 0 ? students.map((st: any) => (
                            <TableRow key={st.id} className="hover:bg-primary/5 transition-colors">
                               <TableCell className="font-bold text-primary">{st.name}</TableCell>
                               <TableCell className="text-center">
                                  <Badge className={cn("text-[8px] font-black", st.gender === 'male' ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700")}>
                                     {st.gender === 'male' ? 'ذكر' : 'أنثى'}
                                  </Badge>
                               </TableCell>
                               {exercises.map((ex: any) => (
                                 <TableCell key={ex.id} className="p-1">
                                    <Input 
                                      type="number"
                                      className="h-10 text-center rounded-lg border-primary/5 bg-muted/20 font-black text-secondary focus:bg-white"
                                      value={st.grades?.[ex.id] || ""}
                                      onChange={(e) => updateGrade(st.id, ex.id, e.target.value)}
                                    />
                                 </TableCell>
                               ))}
                               <TableCell>
                                  <Button onClick={() => deleteStudent(st)} variant="ghost" size="icon" className="h-8 w-8 text-destructive/30 hover:text-destructive">
                                     <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                               </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                               <TableCell colSpan={exercises.length + 3} className="py-20 text-center">
                                  <p className="text-muted-foreground text-xs font-bold">لا يوجد طلاب مضافين لهذا الجدول بعد.</p>
                               </TableCell>
                            </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </div>
               )}
            </CardContent>
         </Card>

         <aside className="space-y-6">
            <Card className="luxury-shadow border-none bg-secondary/5 rounded-3xl p-6 text-center">
               <h3 className="text-lg font-black text-primary mb-4 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5 text-secondary" /> تصدير النتائج
               </h3>
               <div className="grid gap-3">
                  <Button 
                    disabled={!selectedCourseId || isExporting} 
                    onClick={() => handleExport("male")}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm gap-2"
                  >
                    <ImageIcon className="w-4 h-4" /> تصدير درجات الشباب
                  </Button>
                  <Button 
                    disabled={!selectedCourseId || isExporting} 
                    onClick={() => handleExport("female")}
                    className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-black text-sm gap-2"
                  >
                    <ImageIcon className="w-4 h-4" /> تصدير درجات البنات
                  </Button>
               </div>
               <p className="text-[10px] text-muted-foreground mt-4 font-bold">سيتم إنشاء صورة جاهزة تحتوي فقط على الفئة المختارة بتصميم فاخر.</p>
            </Card>

            <div className="bg-primary/5 p-6 rounded-3xl border border-dashed border-primary/20 space-y-4">
               <h4 className="font-black text-primary text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> إحصائيات سريعة</h4>
               <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">عدد الطلاب:</span>
                  <span className="text-primary">{students.length}</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">عدد التمارين:</span>
                  <span className="text-primary">{exercises.length}</span>
               </div>
            </div>
         </aside>
      </div>

      {/* نموذج تصدير الصور (مخفي برمجياً ويظهر عند الالتقاط فقط) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
         <div 
           ref={exportRef} 
           className="w-[800px] p-12 bg-[#F8F5EF] text-right font-headline"
           dir="rtl"
         >
            <div className="border-4 border-primary/10 rounded-[3rem] p-10 bg-white luxury-shadow relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 rounded-br-full" />
               
               <div className="flex items-center justify-between mb-12 relative z-10">
                  <div className="space-y-1">
                     <h2 className="text-3xl font-black text-primary">كشف درجات التمارين التقويمية</h2>
                     <p className="text-xl font-bold text-secondary">{selectedCourse?.title}</p>
                     <p className="text-sm font-black text-muted-foreground mt-2 uppercase tracking-widest">
                        {genderFilter === 'male' ? 'قائمة الشباب' : 'قائمة البنات'} • منصة سراج التعليمية
                     </p>
                  </div>
                  <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center p-3">
                     <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                  </div>
               </div>

               <Table className="border-collapse text-right w-full">
                  <TableHeader>
                    <TableRow className="bg-primary text-white hover:bg-primary border-none">
                      <TableHead className="text-right font-black py-6 px-4 rounded-tr-2xl text-lg">اسم الطالب</TableHead>
                      {exercises.map((ex: any) => (
                        <TableHead key={ex.id} className="text-center font-black text-lg py-6">{ex.title}</TableHead>
                      ))}
                      <TableHead className="text-center font-black py-6 rounded-tl-2xl text-lg">المجموع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((st: any) => {
                      let total = 0;
                      exercises.forEach((ex: any) => { total += Number(st.grades?.[ex.id] || 0); });
                      const maxTotal = exercises.reduce((acc: number, ex: any) => acc + ex.maxGrade, 0);
                      
                      return (
                        <TableRow key={st.id} className="border-b border-primary/5 hover:bg-transparent">
                          <TableCell className="font-black text-primary py-5 px-4 text-lg">{st.name}</TableCell>
                          {exercises.map((ex: any) => (
                            <TableCell key={ex.id} className="text-center font-black text-secondary text-lg">
                               {st.grades?.[ex.id] || "0"}
                            </TableCell>
                          ))}
                          <TableCell className="text-center">
                             <Badge className="bg-primary/5 text-primary border-none font-black text-base px-4 py-1 rounded-xl">
                                {total} / {maxTotal}
                             </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
               </Table>

               <div className="mt-12 text-center border-t border-primary/5 pt-8">
                  <p className="text-xs font-black text-primary opacity-30 uppercase tracking-[0.3em]">www.siraj.io • 2024</p>
               </div>
            </div>
         </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isExerciseModalOpen} onOpenChange={setIsExerciseModalOpen}>
         <DialogContent className="rounded-[2.5rem] p-8 border-none luxury-shadow" dir="rtl">
            <DialogHeader className="text-right mb-6">
               <DialogTitle className="text-2xl font-black text-primary">إضافة تمرين جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="font-bold mr-1">عنوان التمرين (مثلاً: تمرين 1)</Label>
                  <Input value={exerciseForm.title} onChange={(e) => setExerciseForm({...exerciseForm, title: e.target.value})} className="h-14 rounded-2xl border-primary/10" placeholder="اكتب اسم التمرين..." />
               </div>
               <div className="space-y-2">
                  <Label className="font-bold mr-1">الدرجة النهائية</Label>
                  <Input type="number" value={exerciseForm.maxGrade} onChange={(e) => setExerciseForm({...exerciseForm, maxGrade: e.target.value})} className="h-14 rounded-2xl border-primary/10 text-center font-black" />
               </div>
            </div>
            <DialogFooter className="mt-8">
               <Button onClick={handleAddExercise} className="h-14 rounded-2xl bg-primary text-white font-black flex-1 text-lg">تثبيت التمرين</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
         <DialogContent className="rounded-[2.5rem] p-8 border-none luxury-shadow" dir="rtl">
            <DialogHeader className="text-right mb-6">
               <DialogTitle className="text-2xl font-black text-primary">إضافة طالب للرصد</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="font-bold mr-1">اسم الطالب الكامل</Label>
                  <Input value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="h-14 rounded-2xl border-primary/10" placeholder="الاسم كما في الواتساب..." />
               </div>
               <div className="space-y-2">
                  <Label className="font-bold mr-1">الجنس</Label>
                  <Select value={studentForm.gender} onValueChange={(val) => setStudentForm({...studentForm, gender: val})}>
                     <SelectTrigger className="h-14 rounded-2xl border-primary/10 font-bold" dir="rtl">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent dir="rtl">
                        <SelectItem value="male">ذكر (شاب)</SelectItem>
                        <SelectItem value="female">أنثى (بنت)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter className="mt-8">
               <Button onClick={handleAddStudent} className="h-14 rounded-2xl bg-primary text-white font-black flex-1 text-lg">إضافة للقائمة</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WhatsAppGradesPage() {
  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-40" /></div>}>
        <WhatsAppGradesContent />
      </Suspense>
    </div>
  );
}
