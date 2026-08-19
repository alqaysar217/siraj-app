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
  Loader2, 
  UserPlus, 
  GraduationCap, 
  CheckCircle2, 
  PlusCircle, 
  X,
  Image as ImageIcon,
  Search,
  Calendar,
  Edit2,
  AlertTriangle,
  Trophy
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function WhatsAppGradesContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");

  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [uiGenderFilter, setUiGenderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

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

  const calculateTotal = (st: any) => {
    let sum = 0;
    exercises.forEach((ex: any) => {
      sum += Number(st.grades?.[ex.id] || 0);
    });
    return sum;
  };

  const processedStudents = useMemo(() => {
    let list = [...students];
    
    if (searchTerm) {
      list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (uiGenderFilter !== "all") {
      list = list.filter(s => s.gender === uiGenderFilter);
    }

    if (dateFilter) {
      list = list.filter(s => s.createdAt?.startsWith(dateFilter));
    }

    return list.sort((a, b) => calculateTotal(b) - calculateTotal(a));
  }, [students, searchTerm, uiGenderFilter, dateFilter, exercises]);

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

  const handleAddOrEditStudent = async () => {
    if (!db || !selectedCourseId || !studentForm.name) return;

    try {
      if (editingStudent) {
        const updatedStudents = students.map((s: any) => {
          if (s.id === editingStudent.id) {
            return { ...s, name: studentForm.name, gender: studentForm.gender };
          }
          return s;
        });
        await updateDoc(gradeDocRef!, { students: updatedStudents });
        toast({ title: "تم التعديل", description: "تم تحديث بيانات الطالب بنجاح." });
      } else {
        const newStudent = {
          id: "st_" + Date.now(),
          name: studentForm.name,
          gender: studentForm.gender,
          grades: {},
          createdAt: new Date().toISOString().split('T')[0]
        };
        await setDoc(gradeDocRef!, { 
          students: arrayUnion(newStudent),
          updatedAt: serverTimestamp() 
        }, { merge: true });
        toast({ title: "تم الانضمام", description: "تم إضافة الطالب لقائمة الرصد." });
      }
      
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      setStudentForm({ name: "", gender: "male" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ بيانات الطالب." });
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

  const confirmDeleteStudent = async () => {
    if (!db || !selectedCourseId || !studentToDelete) return;
    try {
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: studentToDelete.id,
        originalPath: `whatsapp_grades/${selectedCourseId}`,
        type: "whatsapp_student",
        title: `طالب واتساب: ${studentToDelete.name}`,
        data: studentToDelete,
        deletedAt: serverTimestamp()
      });

      await updateDoc(gradeDocRef!, { students: arrayRemove(studentToDelete) });
      toast({ title: "تم الحذف", description: "تم نقل الطالب لسلة المهملات." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الطالب." });
    } finally {
      setStudentToDelete(null);
    }
  };

  const handleExport = async (targetGender: "male" | "female") => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setGenderFilter(targetGender);
    
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
      link.download = `كشف_درجات_سراج_${targetGender === 'male' ? 'الشباب' : 'البنات'}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "تم التصدير بنجاح", description: "تم تحميل صورة الدرجات." });
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء توليد الصورة." });
    } finally {
      setIsExporting(false);
      setGenderFilter("all");
    }
  };

  const studentsForExport = useMemo(() => {
    if (genderFilter === "all") return processedStudents;
    return processedStudents.filter((s: any) => s.gender === genderFilter);
  }, [processedStudents, genderFilter]);

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);
  const maxTotal = exercises.reduce((acc: number, ex: any) => acc + ex.maxGrade, 0);

  return (
    <div className="container mx-auto px-2 py-6 max-w-7xl text-right" dir="rtl">
      <Navbar />
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-3xl font-black font-headline text-primary">رصد درجات الواتساب</h1>
          <p className="text-muted-foreground text-[10px] md:text-xs font-bold">إدارة الدرجات وإصدار الكشوفات الرسمية.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <Button 
              disabled={!selectedCourseId || isExporting} 
              onClick={() => handleExport("male")}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] gap-2 h-10 px-4"
            >
              <ImageIcon className="w-3.5 h-3.5" /> تصدير الشباب
            </Button>
            <Button 
              disabled={!selectedCourseId || isExporting} 
              onClick={() => handleExport("female")}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-[10px] gap-2 h-10 px-4"
            >
              <ImageIcon className="w-3.5 h-3.5" /> تصدير البنات
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 mb-10">
         <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-4 md:p-8 space-y-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="w-full md:w-80">
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="h-12 rounded-xl bg-white border-primary/10 shadow-sm font-black w-full text-xs md:text-sm" dir="rtl">
                        <SelectValue placeholder="اختر الدورة لبدء الرصد..." />
                      </SelectTrigger>
                      <SelectContent dir="rtl" className="max-w-[90vw]">
                        {courses?.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                             <span className="truncate block max-w-[200px] md:max-w-xs">{c.title}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCourseId && (
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsExerciseModalOpen(true)} variant="outline" className="rounded-xl border-primary/10 gap-2 font-bold h-11 px-4 text-xs">
                          <PlusCircle className="w-4 h-4 text-secondary" /> أضف تمرين
                        </Button>
                        <Button onClick={() => { setEditingStudent(null); setStudentForm({ name: "", gender: "male" }); setIsStudentModalOpen(true); }} className="bg-primary text-white rounded-xl gap-2 font-bold h-11 px-4 text-xs">
                          <UserPlus className="w-4 h-4" /> أضف طالب
                        </Button>
                    </div>
                  )}
               </div>

               {selectedCourseId && (
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                       <Input 
                         placeholder="بحث بالاسم..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="h-10 pr-9 rounded-xl border-primary/5 bg-white text-xs"
                       />
                       <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <Select value={uiGenderFilter} onValueChange={setUiGenderFilter}>
                       <SelectTrigger className="h-10 rounded-xl bg-white border-primary/5 text-xs">
                          <SelectValue placeholder="تصفية بالجنس" />
                       </SelectTrigger>
                       <SelectContent dir="rtl">
                          <SelectItem value="all">كل الطلاب</SelectItem>
                          <SelectItem value="male">الشباب فقط</SelectItem>
                          <SelectItem value="female">البنات فقط</SelectItem>
                       </SelectContent>
                    </Select>
                    <div className="relative">
                       <Input 
                         type="date" 
                         value={dateFilter}
                         onChange={(e) => setDateFilter(e.target.value)}
                         className="h-10 pr-9 rounded-xl border-primary/5 bg-white text-xs"
                       />
                       <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                 </div>
               )}
            </CardHeader>

            <CardContent className="p-0">
               {!selectedCourseId ? (
                 <div className="py-24 text-center opacity-50">
                    <GraduationCap className="w-16 h-16 mx-auto mb-4" />
                    <p className="font-black text-sm">اختر الدورة التعليمية من القائمة أعلاه لبدء رصد درجات الدفعات</p>
                 </div>
               ) : gradeLoading ? (
                 <div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto" /></div>
               ) : (
                 <div className="overflow-x-auto">
                    <Table className="text-right min-w-[500px]">
                       <TableHeader className="bg-muted/10">
                          <TableRow>
                             <TableHead className="text-right font-black py-4 w-48 text-[11px]">اسم الطالب الكامل</TableHead>
                             <TableHead className="text-center font-black py-4 w-12 px-1 text-[10px]">نوع</TableHead>
                             {exercises.map((ex: any, idx: number) => (
                               <TableHead key={ex.id} className="text-center font-black py-4 min-w-[70px] px-1 text-[10px]">
                                  <div className="flex flex-col items-center group relative">
                                     <span className="text-secondary font-black">#{idx + 1}</span>
                                     <span className="text-[8px] opacity-40 font-mono">/{ex.maxGrade}</span>
                                     <button onClick={() => deleteExercise(ex)} className="absolute -top-1 -right-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                  </div>
                               </TableHead>
                             ))}
                             <TableHead className="text-center font-black py-4 w-16 px-1 text-[11px] bg-secondary/5">الإجمالي</TableHead>
                             <TableHead className="text-center font-black py-4 w-16 px-1">إجراء</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {processedStudents.length > 0 ? processedStudents.map((st: any) => (
                            <TableRow key={st.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                               <TableCell className="font-bold text-primary text-xs py-4 truncate">
                                  {st.name}
                               </TableCell>
                               <TableCell className="text-center px-1">
                                  <div className={cn("w-2.5 h-2.5 rounded-full mx-auto shadow-sm", st.gender === 'male' ? "bg-blue-500" : "bg-pink-500")} />
                               </TableCell>
                               {exercises.map((ex: any) => (
                                 <TableCell key={ex.id} className="p-1">
                                    <Input 
                                      type="number"
                                      className="h-9 text-center rounded-lg border-primary/5 bg-muted/30 font-black text-secondary focus:bg-white text-xs p-0"
                                      value={st.grades?.[ex.id] || ""}
                                      onChange={(e) => updateGrade(st.id, ex.id, e.target.value)}
                                    />
                                 </TableCell>
                               ))}
                               <TableCell className="px-1 text-center bg-secondary/5">
                                  <span className="text-xs font-black text-primary">{calculateTotal(st)}</span>
                               </TableCell>
                               <TableCell className="px-1 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                     <button onClick={() => { setEditingStudent(st); setStudentForm({ name: st.name, gender: st.gender }); setIsStudentModalOpen(true); }} className="text-primary/40 hover:text-primary transition-colors p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                     <button onClick={() => setStudentToDelete(st)} className="text-destructive/20 hover:text-destructive transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                               </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                               <TableCell colSpan={exercises.length + 4} className="py-24 text-center opacity-30 italic text-sm">لا توجد بيانات مطابقة للبحث</TableCell>
                            </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </div>
               )}
            </CardContent>
         </Card>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
         <div ref={exportRef} className="min-w-[1000px] w-fit p-10 bg-[#F8F5EF] text-right font-headline" dir="rtl">
            <div className="border-[6px] border-primary/5 rounded-[3rem] p-10 bg-white luxury-shadow relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-[8rem] -z-0" />
               <div className="flex items-start justify-between mb-10 relative z-10">
                  <div className="space-y-2 flex-1">
                     <h2 className="text-4xl font-black text-primary leading-tight">كشف درجات تمارين (الواتساب)</h2>
                     <p className="text-2xl font-bold text-primary/60 leading-none">{selectedCourse?.title}</p>
                     <div className="mt-4">
                        <Badge className={cn("text-lg font-black px-6 py-2 rounded-xl border-none shadow-lg", genderFilter === 'male' ? "bg-blue-600 text-white" : "bg-pink-600 text-white")}>
                           {genderFilter === 'male' ? 'قائمة الشباب المبدعين' : 'قائمة البنات المبدعات'}
                        </Badge>
                     </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center p-4 shadow-xl border border-primary/5">
                        <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
                     </div>
                     <span className="text-xl font-black text-primary tracking-widest opacity-40 uppercase">SIRAJ</span>
                  </div>
               </div>
               <div className="rounded-[2rem] overflow-hidden border border-primary/5 shadow-xl">
                <Table className="border-collapse text-right w-full bg-white table-auto">
                    <TableHeader>
                      <TableRow className="bg-primary text-white border-none">
                        <TableHead className="text-right font-black py-4 px-8 rounded-tr-2xl text-xl text-white whitespace-nowrap">اسم الطالب</TableHead>
                        {exercises.map((ex: any) => (
                          <TableHead key={ex.id} className="text-center font-black text-lg py-4 px-3 text-white whitespace-nowrap border-r border-white/5">
                             <div className="flex flex-col gap-0.5">
                                <span className="leading-none">{ex.title}</span>
                                <span className="text-[10px] opacity-70 font-mono">/{ex.maxGrade}</span>
                             </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-black py-4 px-8 rounded-tl-2xl text-xl bg-secondary text-white whitespace-nowrap">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsForExport.map((st: any) => (
                        <TableRow key={st.id} className="border-b border-primary/5 hover:bg-muted/5 transition-colors">
                          <TableCell className="font-black text-primary py-3 px-8 text-xl whitespace-nowrap">{st.name}</TableCell>
                          {exercises.map((ex: any) => (
                            <TableCell key={ex.id} className="text-center font-black text-secondary text-xl py-3 border-r border-primary/5">{st.grades?.[ex.id] || "0"}</TableCell>
                          ))}
                          <TableCell className="text-center bg-secondary/5 py-3 px-8">
                             <span className="font-black text-2xl text-primary" dir="ltr">{calculateTotal(st)} <small className="text-xs opacity-50">/{maxTotal}</small></span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
               </div>
               <div className="mt-8 flex items-center justify-between opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">نظام سراج للرصد الرقمي • siraj.io</p>
                  <p className="text-[10px] font-bold">تاريخ الإصدار: {new Date().toLocaleDateString('ar-YE')}</p>
               </div>
            </div>
         </div>
      </div>

      <Dialog open={isExerciseModalOpen} onOpenChange={setIsExerciseModalOpen}>
         <DialogContent className="rounded-3xl p-6 border-none luxury-shadow max-w-md" dir="rtl">
            <DialogHeader className="text-right mb-4">
               <DialogTitle className="text-xl font-black text-primary">إضافة تمرين جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
               <div className="space-y-1">
                  <Label className="font-bold text-xs">عنوان التمرين (سيظهر في الكشف)</Label>
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

      <Dialog open={isStudentModalOpen} onOpenChange={(open) => !open && (setIsStudentModalOpen(false), setEditingStudent(null))}>
         <DialogContent className="rounded-3xl p-6 border-none luxury-shadow max-w-md" dir="rtl">
            <DialogHeader className="text-right mb-4">
               <DialogTitle className="text-xl font-black text-primary">
                  {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب للرصد"}
               </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
               <div className="space-y-1">
                  <Label className="font-bold text-xs">اسم الطالب الكامل</Label>
                  <Input value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="h-12 rounded-xl border-primary/10" placeholder="الاسم الأول والأخير" />
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
               <Button onClick={handleAddOrEditStudent} className="h-12 rounded-xl bg-primary text-white font-black flex-1">
                  {editingStudent ? "حفظ التعديلات" : "إضافة للقائمة"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-secondary" />
            </div>
            <AlertDialogHeader className="space-y-2 p-0">
              <AlertDialogTitle className="text-xl font-headline text-primary font-black text-center">حذف الطالب؟</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm font-medium text-center">
                سيتم نقل بيانات الطالب <span className="text-primary font-bold">"{studentToDelete?.name}"</span> لسلة المهملات.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex flex-row gap-3 mt-6">
            <AlertDialogAction onClick={confirmDeleteStudent} className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1 hover:bg-primary/90">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel className="h-11 rounded-xl border-primary/10 font-bold gap-2 flex-1 mt-0">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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