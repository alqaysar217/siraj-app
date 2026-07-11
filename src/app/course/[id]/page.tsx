
"use client";

import { useState, use, useEffect, useMemo, useRef, useCallback } from "react";
import Navbar from "@/components/navbar";
import VideoPlayer from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { 
  PlayCircle, 
  BookOpen, 
  Clock, 
  Loader2, 
  ClipboardList,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  Star,
  Award,
  Lock,
  MessageCircle,
  Copy,
  Trophy,
  Layers,
  ShieldCheck,
  ListVideo,
  AlertCircle,
  PartyPopper,
  Building2,
  Check,
  ArrowLeft,
  ArrowRight,
  ChevronLeft
} from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const WHATSAPP_NUMBER = "+967735952927";

const getLevelName = (level: string) => {
  const levels: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم"
  };
  return levels[level] || level;
};

const getCategoryName = (slug: string) => {
  const categoriesMap: Record<string, string> = {
    programming: "البرمجة والتطوير",
    web: "تطوير الويب",
    games: "برمجة الألعاب",
    networks: "الشبكات والسيرفرات",
    os: "نظم التشغيل",
    databases: "قواعد البيانات",
    ai: "الذكاء الاصطناعي",
    cybersecurity: "الأمن السيبراني",
    encryption: "التشفير والحماية",
    design: "التصميم الإبداعي",
    management: "الإدارة والقيادة",
    accounting: "المحاسبة والمالية",
    economics: "الاقتصاد",
    analysis: "تحليل البيانات",
    math: "الرياضيات البرمجية",
    statistics: "الإحصاء",
    quantitative: "الأساليب الكمية",
    general: "ثقافة عامة"
  };
  return categoriesMap[slug] || slug || "عام";
};

function QuizPlayer({ quizData, onComplete, alreadyAnswered }: { quizData: any[], onComplete: (score: number) => void, alreadyAnswered: boolean }) {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (val: string) => {
    if (showResult) return;
    setAnswers({ ...answers, [currentStep]: val });
  };

  const next = () => {
    if (currentStep < quizData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let correctCount = 0;
    quizData.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correctCount++;
    });
    setScore(correctCount);
    setShowResult(true);
    onComplete(correctCount);
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
  };

  if (!started) {
    return (
      <div className="bg-card p-6 md:p-12 rounded-[2rem] border border-border text-center space-y-6 luxury-shadow animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-orange-50 text-orange-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl md:text-3xl font-black text-primary font-headline">تقويم الوحدة التعليمية</h2>
          <p className="text-muted-foreground text-sm md:text-lg leading-relaxed max-w-lg mx-auto">
            تنبيه: يتم احتساب نقاط هذا تقويم من أول محاولة إجابة فقط. يمكنك إعادة التقويم لاحقاً للمراجعة، ولكن لن تمنح نقاطاً إضافية.
          </p>
        </div>
        <Button onClick={() => setStarted(true)} className="h-14 px-12 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg">
          ابدأ التقويم الآن
        </Button>
      </div>
    );
  }

  if (showResult) {
    const isSuccess = score >= quizData.length / 2;
    const pointsEarned = score * 5;

    return (
      <div className="bg-card p-6 md:p-12 rounded-[2rem] border border-border text-center space-y-8 luxury-shadow animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-muted/30">
          {isSuccess ? <PartyPopper className="w-12 h-12 text-secondary" /> : <XCircle className="w-12 h-12 text-destructive" />}
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-4xl font-black text-primary font-headline">
              {isSuccess ? "أحسنت يا بطل! 🎉" : "محاولة جيدة، يمكنك التحسن"}
            </h2>
            <p className="text-muted-foreground font-bold">{isSuccess ? "لقد اجتزت هذا التقويم بنجاح متميز" : "ننصحك بمراجعة محتوى الوحدة مرة أخرى لتعزيز فهمك"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
             <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">الأسئلة الصحيحة</p>
                <p className="text-2xl font-black text-primary">{score} / {quizData.length}</p>
             </div>
             <div className="bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">النقاط المكتسبة</p>
                <p className="text-2xl font-black text-secondary">{pointsEarned}</p>
             </div>
          </div>
          {alreadyAnswered && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 text-right">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
              <p className="text-[10px] text-orange-800 font-bold leading-relaxed">
                تنبيه: هذه النتيجة للمراجعة فقط. لم يتم إضافة نقاط جديدة لرصيدك لأنك أتممت هذا التقويم مسبقاً.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={reset} variant="outline" className="gap-2 rounded-2xl h-14 px-10 font-black border-primary/10 hover:bg-primary/5">
            <RotateCcw className="w-5 h-5" /> مراجعة التقويم ثانية
          </Button>
        </div>
      </div>
    );
  }

  const q = quizData[currentStep];

  return (
    <div className="bg-card p-5 md:p-12 rounded-[2rem] border border-border luxury-shadow space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-border/50 pb-6">
        <div className="flex items-center gap-3 text-right" dir="rtl">
          <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
            <ClipboardList className="w-6 h-6" />
          </div>
          <span className="text-lg md:text-2xl font-black text-primary font-headline">تقويم الوحدة التعليمية</span>
        </div>
        <span className="text-[10px] md:text-xs font-black bg-primary/5 text-primary px-3 md:px-4 py-1.5 rounded-full">سؤال {currentStep + 1} من {quizData.length}</span>
      </div>
      <div className="space-y-8 text-right" dir="rtl">
        <h3 className="text-lg md:text-3xl font-black text-primary leading-tight">{q.question}</h3>
        <div className="grid gap-3 md:gap-4">
          {(q.type === "true-false" ? ["صح", "خطأ"] : (q.options || [])).filter(Boolean).map((opt: string, i: number) => {
            const isSelected = answers[currentStep] === opt;
            return (
              <button
                key={i} 
                onClick={() => handleAnswer(opt)}
                className={cn(
                  "flex items-center justify-between p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 text-right group",
                  isSelected 
                  ? "border-secondary bg-secondary/5 shadow-md scale-[1.01]" 
                  : "border-muted hover:border-secondary/20 hover:bg-muted/20"
                )}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all",
                    isSelected ? "bg-secondary text-white shadow-lg" : "bg-muted text-muted-foreground group-hover:bg-primary/5"
                  )}>
                    {q.type === "true-false" ? (
                      opt === "صح" ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />
                    ) : (
                      <span className="font-black text-xs md:text-sm">{String.fromCharCode(65 + i)}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm md:text-xl font-bold transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}>{opt}</span>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected ? "border-secondary bg-secondary" : "border-muted"
                )}>
                   {isSelected && <Check className="w-4 h-4 text-white stroke-[4]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <Button 
        disabled={!answers[currentStep]} 
        onClick={next} 
        className="w-full h-14 md:h-16 bg-primary text-white rounded-2xl text-lg md:text-xl font-black shadow-xl shadow-primary/10 transition-transform active:scale-95"
      >
        <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6" />
        {currentStep === quizData.length - 1 ? "إنهاء واستعراض النتيجة" : "تأكيد الإجابة والانتقال"}
      </Button>
    </div>
  );
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { profile, user, isAdmin, loading: userLoading } = useUser();
  const { toast } = useToast();
  const paymentTabRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeTab, setActiveTab] = useState("payment");
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);

  const courseRef = useMemoFirebase(() => db ? doc(db, "courses", id) : null, [db, id]);
  const { data: course, loading: courseLoading } = useDoc(courseRef);

  const lessonsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "courses", id, "lessons"), orderBy("order", "asc")) : null
  , [db, id]);
  const { data: lessons, loading: lessonsLoading } = useCollection(lessonsQuery);

  const bankQuery = useMemoFirebase(() => db ? query(collection(db, "bankAccounts"), orderBy("createdAt", "desc")) : null, [db]);
  const { data: bankAccounts } = useCollection(bankQuery);

  const isEnrolled = useMemo(() => {
    if (isAdmin) return true;
    return Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.includes(id);
  }, [profile, id, isAdmin]);

  const userProgress = useMemo(() => profile?.progress?.[id] || { completedLessons: [], points: 0, quizScores: {}, lastLessonId: null }, [profile, id]);
  
  const allCompletedIds = useMemo(() => {
    return Array.from(new Set([...(userProgress.completedLessons || []), ...localCompleted]));
  }, [userProgress.completedLessons, localCompleted]);

  const currentLessonIndex = useMemo(() => lessons?.findIndex(l => l.id === selectedLessonId) ?? -1, [lessons, selectedLessonId]);
  const currentLesson = lessons?.[currentLessonIndex];

  // مزامنة الحالة والبداية من حيث انتهى الطالب عند اكتمال تحميل البروفايل
  useEffect(() => {
    if (!userLoading && lessons?.length && profile && !hasInitializedRef.current) {
      const lastId = profile?.progress?.[id]?.lastLessonId;
      const startId = (lastId && lessons.some(l => l.id === lastId)) ? lastId : lessons[0].id;
      setSelectedLessonId(startId);
      setLocalCompleted(profile.progress?.[id]?.completedLessons || []);
      hasInitializedRef.current = true;
    }
  }, [lessons, profile, id, userLoading]);

  const selectLesson = useCallback((lessonId: string) => {
    setIsFinishing(false);
    setSelectedLessonId(lessonId);
    if (db && user && isEnrolled) {
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, { [`progress.${id}.lastLessonId`]: lessonId }).catch(() => {});
    }
  }, [db, user, isEnrolled, id]);

  const isLessonLocked = useCallback((lesson: any, index: number) => {
    if (isAdmin || index === 0) return false;
    if (!isEnrolled) return true;
    return !allCompletedIds.includes(lessons?.[index - 1]?.id);
  }, [isAdmin, isEnrolled, allCompletedIds, lessons]);

  const isAllLessonsCompleted = useMemo(() => lessons?.length > 0 && allCompletedIds.length >= lessons.length, [lessons, allCompletedIds]);

  const goToNext = useCallback(() => {
    if (!isEnrolled && currentLessonIndex === 0) {
      setActiveTab("payment");
      paymentTabRef.current?.scrollIntoView({ behavior: "smooth" });
      toast({ title: "محتوى مقفل", description: "يرجى الاشتراك لتتمكن من إكمال الدورة." });
      return;
    }
    if (lessons && currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      selectLesson(nextLesson.id);
    } else if (isAllLessonsCompleted) {
      setIsFinishing(true);
      setSelectedLessonId(null);
    }
  }, [lessons, currentLessonIndex, isEnrolled, selectLesson, isAllLessonsCompleted, toast]);

  const goToPrev = () => {
    if (isFinishing) {
      setIsFinishing(false);
      setSelectedLessonId(lessons?.[lessons.length - 1]?.id || null);
    } else if (currentLessonIndex > 0) {
      setSelectedLessonId(lessons![currentLessonIndex - 1].id);
    }
  };

  const handleLessonComplete = useCallback(async (score?: number) => {
    if (!db || !user || !currentLesson || !isEnrolled) return;
    
    const lessonId = currentLesson.id;
    // تحديث محلي فوري لفتح شريط التقديم
    if (!localCompleted.includes(lessonId)) {
      setLocalCompleted(prev => [...prev, lessonId]);
    }

    const userRef = doc(db, "users", user.uid);
    const updates: any = {};
    const currentPoints = Number(profile?.points || 0);
    const currentCoursePoints = Number(userProgress.points || 0);
    
    // تسجيل إكمال الدرس
    if (!userProgress.completedLessons?.includes(lessonId)) {
      updates[`progress.${id}.completedLessons`] = arrayUnion(lessonId);
      updates[`points`] = currentPoints + 10;
      updates[`progress.${id}.points`] = currentCoursePoints + 10;
    }
    
    // تسجيل نتيجة الاختبار إن وجدت
    if (score !== undefined && !userProgress.quizScores?.[lessonId]) {
      updates[`progress.${id}.quizScores.${lessonId}`] = score;
      const bonus = score * 5;
      updates[`points`] = (Number(updates[`points`] || (currentPoints + (updates.points ? 10 : 0))) || 0) + bonus;
      updates[`progress.${id}.points`] = (Number(updates[`progress.${id}.points`] || (currentCoursePoints + (updates[`progress.${id}.points`] ? 10 : 0))) || 0) + bonus;
    }
    
    if (Object.keys(updates).length > 0) {
      updateDoc(userRef, updates).catch((err) => {
        console.error("Firestore Update Error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      });
    }
    
    if (currentLesson.type === "video") {
      setTimeout(goToNext, 2500);
    }
  }, [db, user, currentLesson, isEnrolled, userProgress, id, goToNext, profile, localCompleted]);

  const CurriculumContent = () => (
    <div className="space-y-6" dir="rtl">
      <Accordion type="single" collapsible className="space-y-4">
        {lessons && lessons.length > 0 && Object.entries(
          lessons.reduce((acc: any, lesson: any) => {
            const unit = lesson.unitTitle || "مقدمة المنهج";
            if (!acc[unit]) acc[unit] = [];
            acc[unit].push(lesson);
            return acc;
          }, {})
        ).map(([unitTitle, unitLessons]: [string, any], uIdx) => (
          <AccordionItem key={unitTitle} value={`unit-${uIdx}`} className="border rounded-2xl overflow-hidden bg-card border-primary/5">
            <AccordionTrigger className="hover:no-underline py-5 px-5 bg-muted/20 text-right [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-4 text-right flex-row">
                <div className="p-2.5 bg-primary text-white rounded-xl shadow-md shrink-0"><BookOpen className="w-5 h-5" /></div>
                <div className="text-right flex-1">
                  <h4 className="text-base font-black text-primary">{unitTitle}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold">{unitLessons.length} عناصر تعليمية</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-3 space-y-1.5">
              {unitLessons.map((lesson: any, lIdx: number) => {
                const gIndex = lessons?.findIndex(l => l.id === lesson.id) ?? 0;
                const isLocked = isLessonLocked(lesson, gIndex);
                const isActive = selectedLessonId === lesson.id;
                const isDone = allCompletedIds.includes(lesson.id);
                return (
                  <button key={lesson.id} disabled={isLocked} onClick={() => { selectLesson(lesson.id); setIsCurriculumOpen(false); }}
                    className={cn("w-full text-right p-4 rounded-xl flex items-center justify-between transition-all", isActive ? "bg-secondary text-white shadow-lg scale-[1.02]" : "hover:bg-primary/5", isLocked && "opacity-40")}>
                    <div className="flex items-center gap-4 text-right flex-row">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0", isActive ? "bg-white/20" : "bg-muted text-primary")}>{lIdx + 1}</div>
                      <div className="text-right flex-1">
                        <div className="text-sm font-bold">{lesson.title}</div>
                        <div className="text-[10px] opacity-70 flex items-center gap-1 mt-1 font-bold"><Clock className="w-3.5 h-3.5" /> {lesson.duration} دقيقة</div>
                      </div>
                    </div>
                    <div className="shrink-0">{isLocked ? <Lock className="w-4 h-4 opacity-50" /> : isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <PlayCircle className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />}</div>
                  </button>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );

  if (courseLoading || lessonsLoading || userLoading || !selectedLessonId && !isFinishing) {
    return <div className="min-h-screen flex flex-col bg-background"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-secondary" /></div></div>;
  }

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {isEnrolled && (
            <div className="w-full bg-white/95 backdrop-blur-xl border border-primary/10 p-4 rounded-2xl shadow-sm flex items-center gap-4">
               <div className="p-2 bg-secondary/10 rounded-lg shrink-0"><ShieldCheck className="w-5 h-5 text-secondary" /></div>
               <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black text-primary"><span>تقدمك الدراسي</span><span className="text-secondary">{Math.round(allCompletedIds.length / (lessons?.length || 1) * 100)}%</span></div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${Math.round(allCompletedIds.length / (lessons?.length || 1) * 100)}%` }} /></div>
               </div>
            </div>
          )}

          <div className="space-y-6">
            {isFinishing ? (
              <div className="bg-white p-6 md:p-16 rounded-[2rem] border-4 border-green-500/10 text-center space-y-8 luxury-shadow animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"><PartyPopper className="w-12 h-12 text-green-600" /></div>
                <h2 className="text-3xl md:text-5xl font-black text-green-800 font-headline">مبارك لك الإنجاز!</h2>
                <div className="bg-primary/5 p-8 rounded-[2.5rem] max-w-2xl mx-auto space-y-6">
                   <p className="font-bold text-primary">لقد أتممت كافة دروس الدورة بنجاح. تواصل معنا لإصدار شهادتك الموثقة.</p>
                   <Button onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,'')}?text=أتممت دورة ${course?.title} وأرغب في الشهادة.`)} className="bg-[#25D366] text-white h-16 rounded-2xl px-12 font-black"><MessageCircle className="w-6 h-6 ml-2" /> طلب الشهادة عبر واتساب</Button>
                </div>
                <Button onClick={goToPrev} variant="ghost" className="text-muted-foreground">العودة للدرس الأخير</Button>
              </div>
            ) : currentLesson && (isAdmin || currentLessonIndex === 0 || isEnrolled) ? (
              <>
                {currentLesson.type === "quiz" ? (
                  <QuizPlayer quizData={currentLesson.quizData || []} alreadyAnswered={!!userProgress.quizScores?.[currentLesson.id]} onComplete={handleLessonComplete} />
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-border luxury-shadow bg-black aspect-video">
                    <VideoPlayer videoId={currentLesson.youtubeId} onComplete={handleLessonComplete} canSeek={isAdmin || allCompletedIds.includes(currentLesson.id)} key={currentLesson.id} />
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex gap-4 w-full">
                    <Button onClick={goToNext} className={cn("h-14 flex-1 font-black text-lg shadow-xl gap-2", !isEnrolled && currentLessonIndex === 0 ? "bg-secondary" : "bg-primary")}>
                      <ArrowRight className="w-5 h-5 ml-1" />
                      <span>{(!isEnrolled && currentLessonIndex === 0) ? "اشترك لفتح البقية" : "الدرس التالي"}</span>
                    </Button>
                    <Button onClick={goToPrev} disabled={currentLessonIndex === 0} variant="outline" className="h-14 flex-1 font-black text-lg gap-2">
                       <ArrowLeft className="w-5 h-5 ml-1" />
                       <span>السابق</span>
                    </Button>
                  </div>
                  <Sheet open={isCurriculumOpen} onOpenChange={setIsCurriculumOpen}>
                    <SheetTrigger asChild><Button variant="secondary" className="h-14 w-full font-black text-lg gap-3 bg-secondary text-white"><ListVideo className="w-6 h-6" /> المنهج الدراسي</Button></SheetTrigger>
                    <SheetContent side="right" className="w-[90%] sm:max-w-md p-0 overflow-y-auto" dir="rtl">
                      <SheetHeader className="p-8 border-b text-right bg-muted/10"><SheetTitle className="text-2xl font-black">منهج الدورة</SheetTitle></SheetHeader>
                      <div className="p-6"><CurriculumContent /></div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="rounded-[2.5rem] aspect-video bg-card border-2 border-dashed border-primary/10 flex flex-col items-center justify-center p-8">
                 <Lock className="w-16 h-16 text-primary opacity-40 mb-4" />
                 <h2 className="text-2xl font-black text-primary">المحتوى مغلق</h2>
                 <p className="text-muted-foreground mt-2">يجب الاشتراك في الدورة لتتمكن من المتابعة.</p>
              </div>
            )}
          </div>

          {(currentLessonIndex === 0 || !isEnrolled) && !isFinishing && (
            <div ref={paymentTabRef} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <Card className="rounded-[2.5rem] border-none luxury-shadow p-5 md:p-8 bg-white space-y-8">
                <div className="text-right space-y-3">
                  <h1 className="text-2xl md:text-4xl font-black text-primary leading-tight">{course?.title}</h1>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{course?.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: "الطلاب", val: course?.studentsCount, icon: Users },
                    { label: "التقييم", val: course?.rating, icon: Star },
                    { label: "المستوى", val: getLevelName(course?.level || "beginner"), icon: Layers },
                    { label: "الشهادة", val: course?.hasCertificate ? "متاحة" : "غير متوفرة", icon: Award },
                  ].map((s, i) => (
                    <div key={i} className="bg-muted/30 p-3 md:p-4 rounded-2xl flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm shrink-0"><s.icon className="w-4 h-4 md:w-5 md:h-5 text-secondary" /></div>
                      <div className="text-right overflow-hidden">
                        <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase">{s.label}</p>
                        <p className="text-[10px] md:text-xs font-bold text-primary truncate">{s.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-8">
                  <p className="text-2xl md:text-4xl font-black text-secondary">{course?.price} <small className="text-sm">ريال</small></p>
                  <Badge variant="outline" className="h-9 px-4 md:px-6 rounded-xl bg-primary/5 text-primary border-primary/10 font-black text-[10px] md:text-xs">
                    {getCategoryName(course?.category || "general")}
                  </Badge>
                </div>
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 bg-card rounded-[2rem] border luxury-shadow overflow-hidden">
                <TabsList className="w-full flex h-14 md:h-16 bg-muted/30 p-1 md:p-1.5 border-b">
                  <TabsTrigger value="payment" className="flex-1 font-black text-sm md:text-lg rounded-xl">تفعيل الدورة</TabsTrigger>
                  <TabsTrigger value="curriculum" className="flex-1 font-black text-sm md:text-lg rounded-xl">المنهج</TabsTrigger>
                </TabsList>
                <TabsContent value="payment" className="p-6 md:p-12 space-y-8 text-right">
                  <h3 className="text-xl md:text-3xl font-black text-primary">الحسابات البنكية المعتمدة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {bankAccounts?.map((bank: any, idx: number) => (
                      <div key={idx} className="bg-white p-5 md:p-6 rounded-[2rem] border border-primary/5 luxury-shadow flex flex-row items-center gap-4 md:gap-6 text-right" dir="rtl">
                        <div className="w-14 h-14 md:w-16 md:h-16 relative bg-muted rounded-2xl shrink-0 overflow-hidden">
                          {bank.imageUrl ? <Image src={bank.imageUrl} alt={bank.bankName} fill className="object-cover" /> : <Building2 className="w-8 h-8 opacity-20 m-4" />}
                        </div>
                        <div className="flex-1 overflow-hidden space-y-1">
                          <h4 className="font-black text-base md:text-lg text-primary truncate">{bank.bankName}</h4>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate font-bold">{bank.accountHolder}</p>
                          <div className="flex items-center justify-between bg-muted/40 p-2 md:p-3 rounded-xl mt-2">
                            <code className="text-[10px] md:sm font-black font-mono text-secondary truncate ml-2" dir="ltr">{bank.accountNumber}</code>
                            <button onClick={() => { navigator.clipboard.writeText(bank.accountNumber); toast({ title: "تم النسخ" }); }} className="p-1.5 bg-white rounded-lg shadow-sm"><Copy className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="curriculum" className="p-6 md:p-8"><CurriculumContent /></TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
