
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Loader2, 
  Award, 
  BookOpen, 
  Star, 
  Trash2, 
  AlertTriangle, 
  X, 
  Eye, 
  Search,
  CheckCircle2,
  Circle,
  PlayCircle,
  ClipboardList,
  RefreshCw,
  Info,
  Calendar,
  PlusCircle,
  Edit2,
  Layers,
  Settings2,
  LayoutGrid,
  Save
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, deleteDoc, setDoc, serverTimestamp, updateDoc, getDocs, addDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

/**
 * مكون فرعي لعرض تفاصيل دروس دورة معينة لطالب محدد
 */
function CourseAuditDetail({ courseId, courseTitle, studentProgress, lessons }: { 
  courseId: string, 
  courseTitle: string, 
  studentProgress: any,
  lessons: any[]
}) {
  const groupedLessons = useMemo(() => {
    return lessons.reduce((acc: any, lesson: any) => {
      const unit = lesson.unitTitle || "بدون عنوان وحدة";
      if (!acc[unit]) acc[unit] = [];
      acc[unit].push(lesson);
      return acc;
    }, {});
  }, [lessons]);

  const completedCount = studentProgress?.completedLessons?.length || 0;
  const totalCount = lessons.length;
  const progressPercent = Math.round((completedCount / (totalCount || 1)) * 100);

  return (
    <Card className="border border-primary/10 overflow-hidden rounded-2xl mb-4 bg-muted/10 text-right">
      <div className="p-4 bg-muted/20 border-b border-primary/5 flex items-center justify-between">
        <div className="text-right">
          <h4 className="font-black text-primary text-sm">{courseTitle}</h4>
          <p className="text-[10px] text-muted-foreground font-bold">{completedCount} من {totalCount} دروس مكتملة</p>
        </div>
        <Badge variant="outline" className="bg-white border-primary/10 text-primary font-black">{progressPercent}%</Badge>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(groupedLessons).map(([unit, unitLessons]: [string, any], i) => (
          <AccordionItem key={i} value={`unit-${i}`} className="border-none px-4">
            <AccordionTrigger className="hover:no-underline py-3 text-xs font-bold text-primary/70 text-right">
              {unit}
            </AccordionTrigger>
            <AccordionContent className="space-y-1 pb-4">
              {unitLessons.map((lesson: any) => {
                const isDone = studentProgress?.completedLessons?.includes(lesson.id);
                const quizScore = studentProgress?.quizScores?.[lesson.id];
                return (
                  <div key={lesson.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-primary/5">
                    <div className="flex items-center gap-3">
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground/30" />}
                      <div className="text-right">
                        <p className={cn("text-[11px] font-bold", isDone ? "text-primary" : "text-muted-foreground")}>{lesson.title}</p>
                        <div className="flex items-center gap-2 opacity-60">
                           {lesson.type === 'quiz' ? <ClipboardList className="w-2.5 h-2.5" /> : <PlayCircle className="w-2.5 h-2.5" />}
                           <span className="text-[9px]">{lesson.type === 'quiz' ? 'تقويم' : 'فيديو'}</span>
                        </div>
                      </div>
                    </div>
                    {lesson.type === 'quiz' && isDone && (
                      <Badge className="bg-secondary/10 text-secondary border-none h-5 text-[9px] font-black">
                        النتيجة: {quizScore || 0}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}

export default function StudentProgressPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // حالات الإدارة
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // حالات التدقيق
  const [auditUser, setAuditUser] = useState<any>(null);
  const [auditLessons, setAuditLessons] = useState<Record<string, any[]>>({});
  const [loadingAudit, setLoadingAudit] = useState(false);

  // حالات الدفعات
  const [activeTab, setActiveTab] = useState("progress");
  const [batchCourseId, setBatchCourseId] = useState("");
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [editingBatch, setBatchToEdit] = useState<any>(null);
  const [batchForm, setBatchForm] = useState({ name: "", startDate: "" });

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const usersQuery = useMemoFirebase(() => db ? query(collection(db, "users")) : null, [db]);
  const { data: users, loading } = useCollection(usersQuery);

  const coursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);
  const { data: courses } = useCollection(coursesQuery);

  const batchesQuery = useMemoFirebase(() => 
    (db && batchCourseId) ? query(collection(db, "courses", batchCourseId, "batches"), orderBy("startDate", "asc")) : null
  , [db, batchCourseId]);
  const { data: batches, loading: batchesLoading } = useCollection(batchesQuery);

  const leaderboard = useMemo(() => {
    if (!users) return [];

    let list = users.map((user: any) => {
      const progressEntries = Object.values(user.progress || {});
      const totalPoints = progressEntries.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0);
      const totalCompletedLessons = progressEntries.reduce((acc: number, curr: any) => acc + (curr.completedLessons?.length || 0), 0);
      
      return {
        ...user,
        totalPoints,
        totalCompletedLessons
      };
    }).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.totalCompletedLessons - a.totalCompletedLessons;
    });

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(u => 
        u.name?.toLowerCase().includes(s) || 
        u.email?.toLowerCase().includes(s)
      );
    }

    let currentRank = 1;
    return list.map((student, index, array) => {
      if (index > 0 && student.totalPoints < array[index - 1].totalPoints) {
        currentRank++;
      }
      return { ...student, displayRank: currentRank };
    });
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    if (!leaderboard.length) return { totalStudents: 0, avgPoints: 0 };
    const totalPointsSum = leaderboard.reduce((acc, curr) => acc + curr.totalPoints, 0);
    return {
      totalStudents: leaderboard.length,
      avgPoints: Math.round(totalPointsSum / leaderboard.length)
    };
  }, [leaderboard]);

  const handleOpenAudit = async (student: any) => {
    if (!db) return;
    setAuditUser(student);
    setLoadingAudit(true);
    setAuditLessons({});

    try {
      const enrolledIds = student.enrolledCourses || [];
      const newAuditLessons: Record<string, any[]> = {};

      for (const courseId of enrolledIds) {
        const lessonsSnap = await getDocs(query(collection(db, "courses", courseId, "lessons"), orderBy("order", "asc")));
        newAuditLessons[courseId] = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      
      setAuditLessons(newAuditLessons);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ في التدقيق", description: "فشل تحميل هيكل المنهج التعليمي لهذا الطالب." });
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleSaveBatch = async () => {
    if (!db || !batchCourseId || !batchForm.name || !batchForm.startDate) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة اسم الدفعة وتاريخ البداية." });
      return;
    }
    setProcessing("batch");
    try {
      const batchData = { ...batchForm, updatedAt: serverTimestamp() };
      if (editingBatch) {
        await updateDoc(doc(db, "courses", batchCourseId, "batches", editingBatch.id), batchData);
        toast({ title: "تم التعديل", description: "تم تحديث بيانات الدفعة بنجاح." });
      } else {
        await addDoc(collection(db, "courses", batchCourseId, "batches"), { ...batchData, createdAt: serverTimestamp() });
        toast({ title: "تمت الإضافة", description: "تم إنشاء دفعة جديدة لهذه الدورة." });
      }
      setIsBatchDialogOpen(false);
      setBatchForm({ name: "", startDate: "" });
      setBatchToEdit(null);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الدفعة." });
    } finally {
      setProcessing(null);
    }
  };

  const deleteBatch = async (batchId: string) => {
    if (!db || !batchCourseId) return;
    try {
      await deleteDoc(doc(db, "courses", batchCourseId, "batches", batchId));
      toast({ title: "تم الحذف", description: "تمت إزالة الدفعة من سجلات الدورة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحذف." });
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        <Tabs dir="rtl" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="text-right">
                <h1 className="text-3xl font-bold font-headline text-primary mb-1">لوحة التميز الأكاديمي</h1>
                <p className="text-muted-foreground text-sm">أدر المتصدرين، دقق إنجازات الطلاب، ونظم الدفعات التعليمية.</p>
              </div>
              <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full md:w-auto luxury-shadow">
                 <TabsTrigger value="progress" className="rounded-xl px-8 font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <TrendingUp className="w-5 h-5" /> تقدم الطلاب
                 </TabsTrigger>
                 <TabsTrigger value="batches" className="rounded-xl px-8 font-black gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Layers className="w-5 h-5" /> إدارة الدفعات
                 </TabsTrigger>
              </TabsList>
           </div>

           <TabsContent value="progress" className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="luxury-shadow border-primary/5">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Users className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="text-right flex-1">
                      <div className="text-2xl font-black text-primary" dir="ltr">{mounted ? stats.totalStudents : '0'}</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase">إجمالي الطلاب</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="luxury-shadow border-primary/5">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-7 h-7 text-secondary" />
                    </div>
                    <div className="text-right flex-1">
                      <div className="text-2xl font-black text-primary" dir="ltr">{mounted ? stats.avgPoints : '0'}</div>
                      <div className="text-xs text-muted-foreground font-bold uppercase">متوسط النقاط</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="luxury-shadow border-primary/5">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                      <Award className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="text-right flex-1">
                      <div className="text-2xl font-black text-primary" dir="ltr">{mounted && leaderboard.length > 0 ? leaderboard[0].totalPoints : '0'}</div>
                      <div className="text-xs text-muted-foreground font-bold uppercase">أعلى رصيد</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
                <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="relative w-full md:max-w-md">
                        <Input 
                          placeholder="ابحث عن طالب بالاسم أو البريد..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-12 rounded-2xl bg-card border-primary/10 pr-12 shadow-sm text-right"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                     </div>
                     <Badge variant="outline" className="border-secondary/20 bg-secondary/5 text-secondary font-black">قائمة الشرف التراكمية</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="py-24 text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold">جاري تحميل البيانات...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="text-right">
                        <TableHeader className="bg-muted/20">
                          <TableRow>
                            <TableHead className="text-center font-black py-5 w-20">المركز</TableHead>
                            <TableHead className="text-right font-black py-5">الطالب</TableHead>
                            <TableHead className="text-center font-black py-5">الدروس</TableHead>
                            <TableHead className="text-center font-black py-5">النقاط</TableHead>
                            <TableHead className="text-center font-black py-5">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboard.map((student) => {
                            const isVisible = student.showInLeaderboard !== false;
                            const rank = student.displayRank;
                            return (
                              <TableRow key={student.uid} className={cn("hover:bg-primary/5 transition-colors border-b border-primary/5", !isVisible && "bg-muted/20 opacity-80")}>
                                <TableCell className="text-center">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center mx-auto font-black text-sm",
                                    rank <= 3 ? "bg-secondary text-white shadow-lg" : "bg-muted text-muted-foreground"
                                  )}>{rank}</div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-4 text-right">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                      <AvatarImage src={student.photoURL || undefined} className="object-cover" />
                                      <AvatarFallback className="bg-primary/5 text-primary font-black">{student.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-black text-primary text-base">{student.name}</div>
                                      <div className="text-[10px] text-muted-foreground font-bold">{student.email}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-sm font-black text-primary">{student.totalCompletedLessons}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 rounded-full">
                                     <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                                     <span className="text-sm font-black text-secondary">{student.totalPoints}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-primary/20 text-primary hover:bg-primary/5" onClick={() => handleOpenAudit(student)}>
                                       <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5" onClick={() => setUserToDelete(student)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="batches" className="space-y-8 animate-in fade-in duration-500">
              <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
                 <CardHeader className="bg-muted/30 border-b border-border/50 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="text-right space-y-1">
                          <CardTitle className="text-2xl font-black text-primary font-headline">تنظيم دفعات الدورات</CardTitle>
                          <CardDescription className="font-bold">أنشئ الدفعات وحدد تاريخ بدايتها لتصنيف الطلاب تلقائياً في قائمة المتصدرين.</CardDescription>
                       </div>
                       <Button disabled={!batchCourseId} onClick={() => { setBatchToEdit(null); setBatchForm({ name: "", startDate: "" }); setIsBatchDialogOpen(true); }} className="bg-secondary hover:bg-secondary/90 text-white rounded-2xl h-14 px-8 font-black gap-2 shadow-xl shadow-secondary/10">
                          <PlusCircle className="w-6 h-6" /> إضافة دفعة جديدة
                       </Button>
                    </div>
                 </CardHeader>
                 <CardContent className="p-8 space-y-10">
                    <div className="max-w-md mx-auto space-y-3">
                       <Label className="font-black text-primary mr-1 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-secondary" /> اختر الدورة التعليمية أولاً
                       </Label>
                       <Select value={batchCourseId} onValueChange={setBatchCourseId}>
                          <SelectTrigger className="h-14 rounded-2xl bg-white border-primary/10 shadow-sm font-bold" dir="rtl">
                             <SelectValue placeholder="حدد دورة لعرض دفعاتها..." />
                          </SelectTrigger>
                          <SelectContent dir="rtl">
                             {courses?.map((c: any) => (
                               <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>

                    {!batchCourseId ? (
                      <div className="py-24 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/20 opacity-50">
                         <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-primary" />
                         <p className="font-black text-primary">يرجى اختيار دورة من القائمة أعلاه للبدء في إدارة دفعاتها.</p>
                      </div>
                    ) : batchesLoading ? (
                      <div className="py-24 text-center">
                         <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
                         <p className="text-muted-foreground font-bold">جاري تحميل دفعات الدورة...</p>
                      </div>
                    ) : batches && batches.length > 0 ? (
                      <div className="grid gap-4">
                         {batches.map((batch: any) => (
                           <div key={batch.id} className="bg-white p-6 rounded-[1.5rem] border border-primary/5 luxury-shadow flex items-center justify-between group">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><Calendar className="w-6 h-6" /></div>
                                 <div className="text-right">
                                    <h3 className="font-black text-primary text-lg leading-none mb-2">{batch.name}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                       <Badge variant="outline" className="bg-muted/50 border-primary/10 text-primary">تاريخ البداية: {batch.startDate}</Badge>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary hover:bg-primary/5" onClick={() => { setBatchToEdit(batch); setBatchForm({ name: batch.name, startDate: batch.startDate }); setIsBatchDialogOpen(true); }}>
                                    <Edit2 className="w-4.5 h-4.5" />
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/5" onClick={() => deleteBatch(batch.id)}>
                                    <Trash2 className="w-4.5 h-4.5" />
                                 </Button>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/20">
                         <Info className="w-16 h-16 mx-auto mb-4 text-secondary opacity-30" />
                         <p className="font-black text-primary">لا يوجد دفعات مسجلة لهذه الدورة بعد.</p>
                         <p className="text-xs text-muted-foreground font-bold mt-1">ابدأ بإضافة الدفعة الأولى لتتمكن من فلترة المتصدرين لاحقاً.</p>
                      </div>
                    )}
                 </CardContent>
              </Card>
           </TabsContent>
        </Tabs>

        {/* نافذة إدارة دفعة */}
        <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
           <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none luxury-shadow [&>button]:hidden" dir="rtl">
              <DialogHeader className="p-8 bg-muted/30 border-b border-border/50 flex flex-row items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary"><Calendar className="w-6 h-6" /></div>
                <div className="text-right flex-1">
                  <DialogTitle className="text-xl font-black text-primary font-headline">
                    {editingBatch ? "تعديل بيانات الدفعة" : "إضافة دفعة جديدة"}
                  </DialogTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsBatchDialogOpen(false)} className="rounded-full h-12 w-12 hover:bg-primary/5"><X className="w-7 h-7" /></Button>
              </DialogHeader>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <Label className="font-black text-primary mr-1">اسم الدفعة</Label>
                    <Input placeholder="مثال: الدفعة الأولى - صيف 2024" value={batchForm.name} onChange={(e) => setBatchForm({...batchForm, name: e.target.value})} className="h-14 rounded-2xl border-primary/10" />
                 </div>
                 <div className="space-y-2">
                    <Label className="font-black text-primary mr-1">تاريخ بداية الدفعة</Label>
                    <Input type="date" value={batchForm.startDate} onChange={(e) => setBatchForm({...batchForm, startDate: e.target.value})} className="h-14 rounded-2xl border-primary/10" />
                 </div>
                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                       ملاحظة: سيتم تصنيف أي طالب تم تفعيل الدورة له ابتداءً من هذا التاريخ وحتى تاريخ بداية الدفعة التالية ضمن هذه الدفعة تلقائياً.
                    </p>
                 </div>
              </div>
              <DialogFooter className="p-8 border-t flex flex-row-reverse gap-3 bg-muted/10">
                 <Button disabled={processing === "batch"} onClick={handleSaveBatch} className="h-14 rounded-2xl bg-primary text-white font-black flex-1 shadow-xl">
                    {processing === "batch" ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ بيانات الدفعة"}
                 </Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

        {/* نافذة التدقيق */}
        <Dialog open={!!auditUser} onOpenChange={(open) => !open && setAuditUser(null)}>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none luxury-shadow [&>button]:hidden" dir="rtl">
              <DialogHeader className="p-8 bg-muted/30 border-b border-border/50 flex flex-row items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-white shadow-xl shrink-0">
                  <AvatarImage src={auditUser?.photoURL || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white text-2xl font-black">{auditUser?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-right flex-1">
                  <DialogTitle className="text-3xl font-black text-primary font-headline mb-1">{auditUser?.name}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-secondary fill-secondary" /> {auditUser?.totalPoints} نقطة</span>
                    <span className="flex items-center gap-1.5 border-r pr-4 border-primary/10"><PlayCircle className="w-4 h-4 text-primary" /> {auditUser?.totalCompletedLessons} دروس</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setAuditUser(null)} className="rounded-full h-12 w-12 hover:bg-primary/5 text-primary">
                  <X className="w-8 h-8" />
                </Button>
              </DialogHeader>
              <div className="p-8">
                 {loadingAudit ? (
                   <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto opacity-40" /></div>
                 ) : auditUser?.enrolledCourses?.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {auditUser.enrolledCourses.map((courseId: string) => {
                        const course = courses?.find(c => c.id === courseId);
                        const lessonsForCourse = auditLessons[courseId] || [];
                        const progress = auditUser.progress?.[courseId] || {};
                        return <CourseAuditDetail key={courseId} courseId={courseId} courseTitle={course?.title || "دورة مجهولة"} studentProgress={progress} lessons={lessonsForCourse} />;
                      })}
                   </div>
                 ) : (
                   <div className="py-24 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-primary/10">
                      <p className="text-lg text-muted-foreground font-black">لا توجد دورات مشتركة لهذا الطالب.</p>
                   </div>
                 )}
              </div>
           </DialogContent>
        </Dialog>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-secondary" />
              </div>
              <AlertDialogHeader className="space-y-2 p-0">
                <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف الطالب؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium">سيتم نقل بيانات الطالب "{userToDelete?.name}" لسلة المهملات.</AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-6">
              <AlertDialogAction onClick={() => {}} className="h-11 rounded-xl bg-primary text-white font-bold flex-1">تأكيد الحذف</AlertDialogAction>
              <AlertDialogCancel className="h-11 rounded-xl border-primary/10 font-bold gap-2 flex-1 mt-0">إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
