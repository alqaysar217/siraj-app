
'use client';

import { useState, useMemo, useRef, Suspense } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Trash2, 
  Download, 
  Loader2, 
  UserPlus, 
  GraduationCap, 
  CheckCircle2, 
  PlusCircle, 
  X,
  Image as ImageIcon,
  Calculator
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
    
    // الانتظار قليلاً لضمان رندر التنسيقات قبل الالتقاط
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const dataUrl = await toPng(exportRef.current!, { 
        cacheBust: true, 
        backgroundColor: '#F8F5EF',
        pixelRatio: 2,
        style: {
          visibility: 'visible',
          position: 'static'
        }
      });
      const link = document.createElement('a');
      link.download = `درجات_سراج_${targetGender === 'male' ? 'الشباب' : 'البنات'}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "تم التصدير بنجاح", description: "تم تحميل صورة الدرجات." });
    } catch (err) {
      toast({ variant: "destructive", title: "فشل التصدير", description: "حدث خطأ أثناء توليد الصورة." });
    } finally {
      setIsExporting(false);
      setGenderFilter("all");
    }
  };

  const filteredStudents = useMemo(() => {
    if (genderFilter === "all") return students;
    return students.filter((s: any) => s.gender === genderFilter);
  }, [students, genderFilter]);

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  const calculateTotal = (st: any) => {
    let sum = 0;
    exercises.forEach((ex: any) => {
      sum += Number(st.grades?.[ex.id] || 0);
    });
    return sum;
  };

  const maxTotal = exercises.reduce((acc: number, ex: any) => acc + ex.maxGrade, 0);

  return (
    <div className="container mx-auto px-2 py-6 max-w-7xl text-right" dir="rtl">
      <header className="mb-6 space-y-1">
        <h1 className="text-xl md:text-3xl font-black font-headline text-primary">رصد درجات الواتساب</h1>
        <p className="text-muted-foreground text-[10px] md:text-xs font-bold">أدر درجات التمارين وصدّر الكشوفات بلمسة زر.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
         <Card className="lg:col-span-3 luxury-shadow border-none bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-3 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
               <div className="w-full md:w-72">
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="h-10 md:h-12 rounded-xl bg-white border-primary/10 shadow-sm font-black w-full text-xs" dir="rtl">
                      <SelectValue placeholder="اختر الدورة لبدء الرصد..." />
                    </SelectTrigger>
                    <SelectContent dir="rtl" className="max-w-[90vw]">
                      {courses?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                           <span className="truncate block max-w-[200px] md:max-w-xs text-xs">{c.title}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
               {selectedCourseId && (
                 <div className="flex items-center gap-2">
                    <Button onClick={() => setIsExerciseModalOpen(true)} variant="outline" size="sm" className="rounded-xl border-primary/10 gap-1.5 font-bold h-9 text-[9px] flex-1 md:flex-none">
                       <PlusCircle className="w-3.5 h-3.5 text-secondary" /> تمرين
                    </Button>
                    <Button onClick={() => setIsStudentModalOpen(true)} size="sm" className="bg-primary text-white rounded-xl gap-1.5 font-bold h-9 text-[9px] flex-1 md:flex-none">
                       <UserPlus className="w-3.5 h-3.5" /> طالب
                    </Button>
                 </div>
               )}
            </CardHeader>
            <CardContent className="p-0">
               {!selectedCourseId ? (
                 <div className="py-20 text-center opacity-50">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-bold text-xs">اختر الدورة لعرض جدول الرصد</p>
                 </div>
               ) : gradeLoading ? (
                 <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto" /></div>
               ) : (
                 <div className="overflow-x-auto">
                    <Table className="text-right min-w-[400px]">
                       <TableHeader className="bg-muted/10">
                          <TableRow>
                             <TableHead className="text-right font-black py-3 w-32 md:w-40 text-[10px]">الاسم</TableHead>
                             <TableHead className="text-center font-black py-3 w-10 px-1 text-[10px]">ج</TableHead>
                             {exercises.map((ex: any, idx: number) => (
                               <TableHead key={ex.id} className="text-center font-black py-3 min-w-[60px] px-1 text-[10px]">
                                  <div className="flex flex-col items-center group relative">
                                     <span className="text-secondary font-black">#{idx + 1}</span>
                                     <span className="text-[7px] opacity-40 font-mono">/{ex.maxGrade}</span>
                                     <button onClick={() => deleteExercise(ex)} className="absolute -top-1 -right-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2.5 h-2.5" /></button>
                                  </div>
                               </TableHead>
                             ))}
                             <TableHead className="text-center font-black py-3 w-12 px-1 text-[10px] bg-secondary/5">كلي</TableHead>
                             <TableHead className="text-center font-black py-3 w-8 px-1"></TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {students.length > 0 ? students.map((st: any) => (
                            <TableRow key={st.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                               <TableCell className="font-bold text-primary text-[11px] py-3 truncate max-w-[120px]">{st.name}</TableCell>
                               <TableCell className="text-center px-1">
                                  <div className={cn("w-2 h-2 rounded-full mx-auto", st.gender === 'male' ? "bg-blue-500" : "bg-pink-500")} title={st.gender === 'male' ? 'ذكر' : 'أنثى'} />
                               </TableCell>
                               {exercises.map((ex: any) => (
                                 <TableCell key={ex.id} className="p-1">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <Input 
                                        type="number"
                                        className="h-8 text-center rounded-lg border-primary/5 bg-muted/30 font-black text-secondary focus:bg-white text-[10px] p-0"
                                        value={st.grades?.[ex.id] || ""}
                                        onChange={(e) => updateGrade(st.id, ex.id, e.target.value)}
                                      />
                                    </div>
                                 </TableCell>
                               ))}
                               <TableCell className="px-1 text-center bg-secondary/5">
                                  <span className="text-[10px] font-black text-primary">{calculateTotal(st)}</span>
                               </TableCell>
                               <TableCell className="px-1">
                                  <button onClick={() => deleteStudent(st)} className="text-destructive/20 hover:text-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
                               </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                               <TableCell colSpan={exercises.length + 4} className="py-20 text-center opacity-30 italic text-[10px]">لا يوجد طلاب مضافين</TableCell>
                            </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </div>
               )}
            </CardContent>
         </Card>

         <aside className="space-y-4">
            <Card className="luxury-shadow border-none bg-secondary/5 rounded-2xl p-5 text-center">
               <h3 className="text-sm font-black text-primary mb-3 flex items-center justify-center gap-2">
                  <Download className="w-3.5 h-3.5 text-secondary" /> تصدير النتائج
               </h3>
               <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  <Button 
                    disabled={!selectedCourseId || isExporting} 
                    onClick={() => handleExport("male")}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] gap-2"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> كشف الشباب
                  </Button>
                  <Button 
                    disabled={!selectedCourseId || isExporting} 
                    onClick={() => handleExport("female")}
                    className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-[10px] gap-2"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> كشف البنات
                  </Button>
               </div>
            </Card>

            <div className="bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/20 space-y-2">
               <h4 className="font-black text-primary text-[10px] flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-secondary" /> الإحصائيات</h4>
               <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-muted-foreground">الطلاب:</span>
                  <span className="text-primary">{students.length}</span>
               </div>
               <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-muted-foreground">التمارين:</span>
                  <span className="text-primary">{exercises.length}</span>
               </div>
               <div className="flex justify-between items-center text-[9px] font-bold border-t pt-1 border-primary/10">
                  <span className="text-muted-foreground">الدرجة الكلية:</span>
                  <span className="text-secondary font-black">/{maxTotal}</span>
               </div>
            </div>
         </aside>
      </div>

      {/* نموذج التصدير المخفي */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
         <div 
           ref={exportRef} 
           className="w-[850px] p-12 bg-[#F8F5EF] text-right font-headline"
           dir="rtl"
         >
            <div className="border-[6px] border-primary/10 rounded-[3.5rem] p-12 bg-white luxury-shadow relative overflow-hidden">
               <div className="absolute top-0 left-0 w-40 h-40 bg-secondary/5 rounded-br-full" />
               <div className="flex items-center justify-between mb-14 relative z-10">
                  <div className="space-y-2">
                     <h2 className="text-4xl font-black text-primary">كشف درجات التمارين والتقييم</h2>
                     <p className="text-2xl font-bold text-secondary">{selectedCourse?.title}</p>
                     <div className="flex items-center gap-4 mt-4">
                        <Badge className={cn("text-sm font-black px-4 py-1.5 rounded-full border-none shadow-sm", genderFilter === 'male' ? "bg-blue-600 text-white" : "bg-pink-600 text-white")}>
                           {genderFilter === 'male' ? 'قائمة الشباب المبدعين' : 'قائمة البنات المبدعات'}
                        </Badge>
                        <span className="text-xs font-black text-muted-foreground tracking-widest">منصة سراج التعليمية • SIRAJ.IO</span>
                     </div>
                  </div>
                  <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center p-4 shadow-xl">
                     <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                  </div>
               </div>
               
               <div className="rounded-3xl overflow-hidden border border-primary/5 shadow-inner">
                <Table className="border-collapse text-right w-full bg-white">
                    <TableHeader>
                      <TableRow className="bg-primary text-white border-none">
                        <TableHead className="text-right font-black py-7 px-6 rounded-tr-2xl text-xl">اسم الطالب</TableHead>
                        {exercises.map((ex: any) => (
                          <TableHead key={ex.id} className="text-center font-black text-lg py-7">
                             <div className="flex flex-col">
                                <span>{ex.title}</span>
                                <span className="text-[10px] opacity-60 font-mono">/{ex.maxGrade}</span>
                             </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-black py-7 rounded-tl-2xl text-xl bg-secondary/90">المجموع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((st: any) => {
                        const total = calculateTotal(st);
                        return (
                          <TableRow key={st.id} className="border-b border-primary/5 hover:bg-muted/5 transition-colors">
                            <TableCell className="font-black text-primary py-6 px-6 text-xl">{st.name}</TableCell>
                            {exercises.map((ex: any) => (
                              <TableCell key={ex.id} className="text-center font-black text-secondary text-xl">
                                 {st.grades?.[ex.id] || "0"}
                              </TableCell>
                            ))}
                            <TableCell className="text-center bg-secondary/5">
                               <div className="inline-flex items-center gap-1.5 px-6 py-2 bg-primary/5 text-primary border border-primary/10 rounded-2xl">
                                  <Calculator className="w-4 h-4 text-secondary" />
                                  <span className="font-black text-2xl" dir="ltr">{total} <small className="text-xs opacity-50">/{maxTotal}</small></span>
                               </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                </Table>
               </div>
               <div className="mt-12 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">تم إصدار هذا الكشف آلياً بواسطة نظام سراج للرصد الرقمي</p>
               </div>
            </div>
         </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isExerciseModalOpen} onOpenChange={setIsExerciseModalOpen}>
         <DialogContent className="rounded-3xl p-6 border-none luxury-shadow max-w-[90vw]" dir="rtl">
            <DialogHeader className="text-right mb-4">
               <DialogTitle className="text-xl font-black text-primary">إضافة تمرين جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
               <div className="space-y-1">
                  <Label className="font-bold text-xs">عنوان التمرين</Label>
                  <Input value={exerciseForm.title} onChange={(e) => setExerciseForm({...exerciseForm, title: e.target.value})} className="h-12 rounded-xl border-primary/10" placeholder="مثلاً: التمرين الأول" />
               </div>
               <div className="space-y-1">
                  <Label className="font-bold text-xs">الدرجة النهائية</Label>
                  <Input type="number" value={exerciseForm.maxGrade} onChange={(e) => setExerciseForm({...exerciseForm, maxGrade: e.target.value})} className="h-12 rounded-xl border-primary/10 text-center font-black text-lg" />
               </div>
            </div>
            <DialogFooter className="mt-6">
               <Button onClick={handleAddExercise} className="h-12 rounded-xl bg-primary text-white font-black flex-1">تثبيت التمرين</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
         <DialogContent className="rounded-3xl p-6 border-none luxury-shadow max-w-[90vw]" dir="rtl">
            <DialogHeader className="text-right mb-4">
               <DialogTitle className="text-xl font-black text-primary">إضافة طالب للرصد</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
               <div className="space-y-1">
                  <Label className="font-bold text-xs">اسم الطالب</Label>
                  <Input value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="h-12 rounded-xl border-primary/10" placeholder="الاسم كما في الواتساب" />
               </div>
               <div className="space-y-1">
                  <Label className="font-bold text-xs">الجنس</Label>
                  <Select value={studentForm.gender} onValueChange={(val) => setStudentForm({...studentForm, gender: val})}>
                     <SelectTrigger className="h-12 rounded-xl border-primary/10 font-bold" dir="rtl">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent dir="rtl">
                        <SelectItem value="male">ذكر (شاب)</SelectItem>
                        <SelectItem value="female">أنثى (بنت)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter className="mt-6">
               <Button onClick={handleAddStudent} className="h-12 rounded-xl bg-primary text-white font-black flex-1">إضافة للقائمة</Button>
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
