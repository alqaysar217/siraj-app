
"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, setDoc } from "firebase/firestore";
import { useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  PlayCircle, 
  Save, 
  Video, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit2,
  FileText,
  Layers,
  Clock,
  ListOrdered,
  HelpCircle,
  FolderOpen,
  AlertTriangle,
  X,
  PlusCircle,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
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

type Question = {
  id: string;
  question: string;
  type: "mcq" | "true-false";
  options: string[];
  correctAnswer: string;
};

export default function ManageLessonsPage() {
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [lessonToDelete, setLessonToDelete] = useState<any>(null);
  const [isNewUnitMode, setIsNewUnitMode] = useState(false);
  
  const db = useFirestore();
  const { toast } = useToast();

  const coursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);
  const { data: courses } = useCollection(coursesQuery);

  const lessonsQuery = useMemoFirebase(() => 
    (db && selectedCourseId) ? query(collection(db, "courses", selectedCourseId, "lessons"), orderBy("order", "asc")) : null
  , [db, selectedCourseId]);
  const { data: lessons, loading: lessonsLoading } = useCollection(lessonsQuery);

  const [formData, setFormData] = useState({
    title: "",
    unitTitle: "",
    type: "video" as "video" | "quiz",
    youtubeId: "",
    duration: "10:00",
    isFree: false,
    order: "1"
  });

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  // استخراج قائمة الوحدات الفريدة المتاحة للدورة المختارة حالياً فقط
  const existingUnits = useMemo(() => {
    if (!lessons) return [];
    const units = lessons.map((l: any) => l.unitTitle).filter(Boolean);
    return Array.from(new Set(units)) as string[];
  }, [lessons]);

  // تجميع الدروس حسب الوحدات للعرض
  const groupedLessons = useMemo(() => {
    if (!lessons) return {};
    return lessons.reduce((acc: any, lesson: any) => {
      const unit = lesson.unitTitle || "بدون عنوان وحدة";
      if (!acc[unit]) acc[unit] = [];
      acc[unit].push(lesson);
      return acc;
    }, {});
  }, [lessons]);

  const extractYouTubeId = (url: string) => {
    if (!url) return "";
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : url;
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question: "",
      type: "mcq",
      options: ["", "", "", ""],
      correctAnswer: ""
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuizQuestions(quizQuestions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const openAddDialog = () => {
    setEditingLessonId(null);
    setIsNewUnitMode(existingUnits.length === 0);
    setFormData({
      title: "",
      unitTitle: "",
      type: "video",
      youtubeId: "",
      duration: "10:00",
      isFree: false,
      order: String((lessons?.length || 0) + 1)
    });
    setQuizQuestions([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setIsNewUnitMode(false);
    setFormData({
      title: lesson.title,
      unitTitle: lesson.unitTitle || "",
      type: lesson.type || "video",
      youtubeId: lesson.youtubeId || "",
      duration: lesson.duration || "10:00",
      isFree: lesson.isFree || false,
      order: String(lesson.order || 1)
    });
    setQuizQuestions(lesson.quizData || []);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!db || !selectedCourseId || !formData.title || !formData.unitTitle) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال عنوان الدرس وعنوان الوحدة." });
      return;
    }

    setLoading(true);
    const finalVideoId = formData.type === "video" ? extractYouTubeId(formData.youtubeId) : null;

    const lessonData = {
      title: formData.title,
      unitTitle: formData.unitTitle,
      type: formData.type,
      youtubeId: finalVideoId,
      quizData: formData.type === "quiz" ? quizQuestions : null,
      duration: formData.duration,
      isFree: formData.isFree,
      order: Number(formData.order) || 1,
      updatedAt: serverTimestamp()
    };

    const lessonsCollection = collection(db, "courses", selectedCourseId, "lessons");

    if (editingLessonId) {
      const lessonRef = doc(db, "courses", selectedCourseId, "lessons", editingLessonId);
      updateDoc(lessonRef, lessonData)
        .then(() => {
          toast({ title: "تم التحديث", description: "تم تعديل الدرس بنجاح." });
          setIsDialogOpen(false);
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: lessonRef.path, operation: 'update', requestResourceData: lessonData }));
        })
        .finally(() => setLoading(false));
    } else {
      addDoc(lessonsCollection, { ...lessonData, createdAt: serverTimestamp() })
        .then(() => {
          toast({ title: "تمت الإضافة", description: "تم إضافة الدرس بنجاح." });
          setIsDialogOpen(false);
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: lessonsCollection.path, operation: 'create', requestResourceData: lessonData }));
        })
        .finally(() => setLoading(false));
    }
  };

  const confirmDelete = async () => {
    if (!db || !selectedCourseId || !lessonToDelete) return;
    try {
      // نقل للسلة
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: lessonToDelete.id,
        originalPath: `courses/${selectedCourseId}/lessons/${lessonToDelete.id}`,
        type: "lesson",
        title: lessonToDelete.title,
        data: lessonToDelete,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, "courses", selectedCourseId, "lessons", lessonToDelete.id));
      toast({ title: "تم النقل للسلة", description: "تم نقل الدرس إلى سلة المهملات." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الدرس." });
    } finally {
      setLessonToDelete(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <h1 className="text-3xl font-bold font-headline text-primary">إدارة محتوى المنهج</h1>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="h-12 w-full md:w-72 rounded-xl border-primary/20 shadow-sm" dir="rtl">
                <SelectValue placeholder="اختر الدورة لعرض الوحدات..." />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {courses?.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={!selectedCourseId} onClick={openAddDialog} className="bg-secondary hover:bg-secondary/90 h-12 rounded-xl gap-2 font-bold px-6 shadow-md">
              <Plus className="w-5 h-5" /> إضافة درس
            </Button>
          </div>
        </div>

        {!selectedCourseId ? (
          <Card className="border-dashed border-2 py-24 text-center bg-muted/20 rounded-[2rem]">
            <FolderOpen className="w-20 h-20 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground">اختر دورة تدريبية لعرض هيكل المنهج الخاص بها</h2>
          </Card>
        ) : lessonsLoading ? (
          <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>
        ) : Object.keys(groupedLessons).length > 0 ? (
          <div className="space-y-10">
            {Object.entries(groupedLessons).map(([unitTitle, unitLessons]: [string, any]) => (
              <div key={unitTitle} className="space-y-4">
                <div className="flex items-center gap-3 border-r-4 border-secondary pr-4">
                  <h2 className="text-xl font-black text-primary font-headline">{unitTitle}</h2>
                  <span className="text-xs bg-primary/5 text-primary px-3 py-1 rounded-full font-bold">
                    {unitLessons.length} عناصر
                  </span>
                </div>
                <div className="grid gap-3 pr-2">
                  {unitLessons.map((lesson: any) => (
                    <Card key={lesson.id} className="luxury-shadow border-none hover:bg-muted/30 transition-all">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center font-bold text-primary text-sm">
                            {lesson.order}
                          </div>
                          <div className="text-right">
                            <h3 className="font-bold text-primary">{lesson.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {lesson.type === "quiz" ? <ClipboardList className="w-3.5 h-3.5 text-orange-500" /> : <PlayCircle className="w-3.5 h-3.5 text-blue-500" />}
                                {lesson.type === "quiz" ? "تقويم الوحدة" : "فيديو تعليمي"}
                              </span>
                              <span className="text-[10px] text-muted-foreground border-r pr-3 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {lesson.duration}
                              </span>
                              {lesson.isFree && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">مجاني</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => openEditDialog(lesson)} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/5">
                            <Edit2 className="w-4 h-4 text-primary" />
                          </Button>
                          <Button onClick={() => setLessonToDelete(lesson)} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-destructive/5 text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 py-24 text-center bg-muted/20 rounded-[2rem]">
            <Plus className="w-20 h-20 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-muted-foreground">لا توجد دروس أو وحدات مضافة لهذه الدورة</h2>
            <Button onClick={openAddDialog} className="mt-6 bg-primary text-white rounded-xl">أضف أول درس الآن</Button>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:right-auto [&>button]:left-4 rounded-[2rem]" dir="rtl">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
              <DialogTitle className="text-2xl font-headline font-bold text-primary">
                {editingLessonId ? "تعديل بيانات الدرس" : "إضافة درس جديد"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 text-right">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 font-bold text-primary">
                      <FolderOpen className="w-4 h-4 text-secondary" /> عنوان الوحدة
                    </Label>
                    
                    {existingUnits.length > 0 && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setIsNewUnitMode(!isNewUnitMode);
                          if (!isNewUnitMode) setFormData(prev => ({ ...prev, unitTitle: "" }));
                        }}
                        className="text-xs h-7 gap-1 text-secondary hover:bg-secondary/5"
                      >
                        {isNewUnitMode ? <RefreshCw className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                        {isNewUnitMode ? "اختيار وحدة موجودة" : "وحدة جديدة"}
                      </Button>
                    )}
                  </div>
                  
                  {isNewUnitMode || existingUnits.length === 0 ? (
                    <Input 
                      placeholder="اكتب اسم الوحدة الجديدة هنا..." 
                      value={formData.unitTitle}
                      onChange={(e) => setFormData({...formData, unitTitle: e.target.value})}
                      className="h-12 rounded-xl text-right border-secondary/20 focus:border-secondary"
                    />
                  ) : (
                    <Select 
                      value={formData.unitTitle} 
                      onValueChange={(val) => setFormData({...formData, unitTitle: val})}
                    >
                      <SelectTrigger className="h-12 rounded-xl" dir="rtl">
                        <SelectValue placeholder="اختر من الوحدات السابقة لهذه الدورة..." />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {existingUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-bold text-primary">
                    <FileText className="w-4 h-4 text-secondary" /> عنوان الدرس
                  </Label>
                  <Input 
                    placeholder="اسم الدرس بالتفصيل..." 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-12 rounded-xl text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-primary">
                      <Layers className="w-4 h-4 text-secondary" /> النوع
                    </Label>
                    <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                      <SelectTrigger className="h-12 rounded-xl" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="video">فيديو تعليمي</SelectItem>
                        <SelectItem value="quiz">تقويم وحدة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-primary">
                      <ListOrdered className="w-4 h-4 text-secondary" /> الترتيب
                    </Label>
                    <Input 
                      type="number" 
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: e.target.value})}
                      className="h-12 rounded-xl text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-primary">
                      <Clock className="w-4 h-4 text-secondary" /> المدة الزمنية
                    </Label>
                    <Input 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="h-12 rounded-xl text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-2xl mt-8">
                    <Label className="text-xs font-bold text-primary">درس مجاني</Label>
                    <Switch 
                      checked={formData.isFree} 
                      onCheckedChange={(val) => setFormData({...formData, isFree: val})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {formData.type === "video" ? (
                  <div className="space-y-3 p-5 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-blue-500 rounded-lg text-white">
                        <Video className="w-5 h-5" />
                      </div>
                      <Label className="text-blue-900 font-bold">رابط فيديو اليوتيوب</Label>
                    </div>
                    <Input 
                      placeholder="الصق الرابط هنا..." 
                      value={formData.youtubeId}
                      onChange={(e) => setFormData({...formData, youtubeId: e.target.value})}
                      className="h-12 rounded-xl border-blue-200 text-left"
                      dir="ltr"
                    />
                  </div>
                ) : (
                  <div className="p-5 bg-orange-50/50 rounded-[1.5rem] border border-orange-100 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-500 rounded-lg text-white">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <Label className="text-orange-900 font-bold text-lg">الأسئلة التقويمية</Label>
                      </div>
                      <button type="button" onClick={handleAddQuestion} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-9 px-4 text-xs flex items-center gap-2 transition-all shadow-sm">
                        <Plus className="w-4 h-4" /> أضف سؤال
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pl-2">
                      {quizQuestions.length === 0 && (
                        <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-orange-200">
                           <HelpCircle className="w-12 h-12 text-orange-200 mx-auto mb-2" />
                           <p className="text-sm text-orange-400 font-bold">لم يتم إنشاء أي أسئلة لهذا التقويم بعد.</p>
                        </div>
                      )}
                      {quizQuestions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm space-y-4 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">السؤال #{idx + 1}</span>
                            <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="h-8 w-8 text-destructive hover:bg-destructive/5">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-bold flex items-center gap-1">نص السؤال</Label>
                            <Input 
                              placeholder="اكتب السؤال هنا..." 
                              value={q.question}
                              onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                              className="h-10 text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-bold flex items-center gap-1">نوع السؤال</Label>
                            <Select value={q.type} onValueChange={(val: any) => updateQuestion(q.id, "type", val)}>
                              <SelectTrigger className="h-10 text-xs" dir="rtl">
                                <SelectValue placeholder="اختر النوع..." />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                <SelectItem value="mcq">اختيار من متعدد</SelectItem>
                                <SelectItem value="true-false">صح أو خطأ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {q.type === "mcq" && (
                            <div className="grid grid-cols-1 gap-3 mt-2 bg-muted/30 p-3 rounded-xl border border-dashed">
                              <div className="grid grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="space-y-1">
                                    <Input 
                                      placeholder={`خيار ${oIdx + 1}`}
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...q.options];
                                        newOpts[oIdx] = e.target.value;
                                        updateQuestion(q.id, "options", newOpts);
                                      }}
                                      className="h-9 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-green-700 font-bold">الإجابة الصحيحة</Label>
                                <Input 
                                  placeholder="اكتب نص الإجابة الصحيحة..." 
                                  value={q.correctAnswer}
                                  onChange={(e) => updateQuestion(q.id, "correctAnswer", e.target.value)}
                                  className="h-10 text-sm border-green-200 bg-green-50"
                                />
                              </div>
                            </div>
                          )}

                          {q.type === "true-false" && (
                            <div className="p-3 bg-green-50/50 rounded-xl border border-green-100">
                               <Label className="text-[10px] text-green-700 font-bold block mb-2">اختر الإجابة الصحيحة</Label>
                               <Select value={q.correctAnswer} onValueChange={(val) => updateQuestion(q.id, "correctAnswer", val)}>
                                <SelectTrigger className="h-10 text-sm border-green-200 bg-white" dir="rtl">
                                  <SelectValue placeholder="حدد الإجابة..." />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  <SelectItem value="صح">صح</SelectItem>
                                  <SelectItem value="خطأ">خطأ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-3 mt-6 border-t pt-6 flex-row-reverse">
              <Button disabled={loading} onClick={handleSubmit} className="bg-primary text-white h-14 px-12 rounded-2xl font-bold flex-1 text-lg shadow-lg">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 ml-2" />}
                حفظ بيانات المنهج
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 rounded-2xl px-8 font-bold border-primary/10">إلغاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!lessonToDelete} onOpenChange={(open) => !open && setLessonToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-secondary" />
              </div>
              <AlertDialogHeader className="space-y-2 p-0">
                <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف الدرس؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed">
                  سيتم نقل <span className="text-primary font-bold">"{lessonToDelete?.title}"</span> إلى سلة المهملات.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-6">
              <AlertDialogAction 
                onClick={confirmDelete}
                className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1 hover:bg-primary/90"
              >
                <Trash2 className="w-4 h-4" /> تأكيد الحذف
              </AlertDialogAction>
              <AlertDialogCancel className="h-11 rounded-xl border-primary/10 font-bold gap-2 flex-1 mt-0">
                <X className="w-4 h-4" /> إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
