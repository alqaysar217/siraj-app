
"use client";

import { useState, use, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import Navbar from "@/components/navbar";
import VideoPlayer from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PlayCircle, 
  BookOpen, 
  Clock, 
  Loader2, 
  ClipboardList,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Users,
  Star,
  Award,
  Lock,
  MessageCircle,
  Copy,
  Trophy,
  Layers,
  ShieldCheck,
  User,
  ListVideo,
  AlertCircle,
  PartyPopper,
  Send,
  CreditCard,
  Building2,
  Check,
  X,
  Languages
} from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, updateDoc, arrayUnion, addDoc, serverTimestamp, where } from "firebase/firestore";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const WHATSAPP_NUMBER = "+967775258830";

// Helper Functions
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
          <div className="bg-muted/30 p-6 rounded-2xl text-right space-y-4">
             <h4 className="font-black text-primary flex items-center gap-2 border-b border-primary/5 pb-2">
                <ListVideo className="w-4 h-4 text-secondary" /> ملخص الأداء:
             </h4>
             <div className="grid gap-2">
                {quizData.map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctAnswer;
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-primary/5 shadow-sm">
                       <span className="text-xs font-bold text-primary">السؤال رقم {idx + 1}</span>
                       <div className={cn(
                         "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black",
                         isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                       )}>
                          {isCorrect ? <><Check className="w-3.5 h-3.5" /> صحيح</> : <><X className="w-3.5 h-3.5" /> خاطئ</>}
                       </div>
                    </div>
                  );
                })}
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
        <div className="flex items-center gap-3">
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
        {currentStep === quizData.length - 1 ? "إنهاء واستعراض النتيجة" : "تأكيد الإجابة والانتقال"}
        <ChevronLeft className="mr-3 w-5 h-5 md:w-6 md:h-6" />
      </Button>
    </div>
  );
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { profile, user, isAdmin } = useUser();
  const { toast } = useToast();
  const paymentTabRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState("payment");
  const [showCertForm, setShowCertForm] = useState(false);
  const [certNameAr, setCertNameAr] = useState("");
  const [certNameEn, setCertNameEn] = useState("");

  const courseRef = useMemoFirebase(() => db ? doc(db, "courses", id) : null, [db, id]);
  const { data: course, loading: courseLoading } = useDoc(courseRef);

  const lessonsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "courses", id, "lessons"), orderBy("order", "asc")) : null
  , [db, id]);
  const { data: lessons, loading: lessonsLoading } = useCollection(lessonsQuery);

  const reviewsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "reviews"), where("courseId", "==", id)) : null
  , [db, id]);
  const { data: reviewsData } = useCollection(reviewsQuery);

  const bankQuery = useMemoFirebase(() => db ? query(collection(db, "bankAccounts"), orderBy("createdAt", "desc")) : null, [db]);
  const { data: bankAccounts } = useCollection(bankQuery);

  const reviews = useMemo(() => {
    if (!reviewsData) return [];
    return [...reviewsData].sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [reviewsData]);

  const isEnrolled = useMemo(() => {
    if (isAdmin) return true;
    return profile?.enrolledCourses?.includes(id) && profile?.enrollmentDetails?.[id]?.status === 'active';
  }, [profile, id, isAdmin]);

  const userProgress = useMemo(() => profile?.progress?.[id] || { completedLessons: [], points: 0, quizScores: {}, lastLessonId: null }, [profile, id]);
  const currentLessonIndex = useMemo(() => lessons?.findIndex(l => l.id === selectedLessonId) ?? -1, [lessons, selectedLessonId]);
  const currentLesson = lessons?.[currentLessonIndex];

  const selectLesson = useCallback((lessonId: string) => {
    setIsFinishing(false);
    setSelectedLessonId(lessonId);
    if (db && user && isEnrolled) {
      updateDoc(doc(db, "users", user.uid), { [`progress.${id}.lastLessonId`]: lessonId });
    }
  }, [db, user, isEnrolled, id]);

  useEffect(() => {
    if (lessons?.length && !hasInitializedRef.current) {
      if (profile || user === null) {
        const lastId = userProgress.lastLessonId;
        const startId = (lastId && isEnrolled && lessons.some(l => l.id === lastId)) ? lastId : lessons[0].id;
        setSelectedLessonId(startId);
        hasInitializedRef.current = true;
      }
    }
  }, [lessons, profile, user, userProgress.lastLessonId, isEnrolled]);

  const groupedLessons = useMemo(() => {
    if (!lessons) return {};
    return lessons.reduce((acc: any, lesson: any) => {
      const unit = lesson.unitTitle || "مقدمة المنهج";
      if (!acc[unit]) acc[unit] = [];
      acc[unit].push(lesson);
      return acc;
    }, {});
  }, [lessons]);
  
  const isLessonLocked = useCallback((lesson: any, index: number) => {
    if (isAdmin || index === 0) return false;
    if (!isEnrolled) return true;
    return !userProgress.completedLessons?.includes(lessons?.[index - 1]?.id);
  }, [isAdmin, isEnrolled, userProgress.completedLessons, lessons]);

  const isAllLessonsCompleted = useMemo(() => lessons?.length > 0 && userProgress.completedLessons?.length === lessons.length, [lessons, userProgress.completedLessons]);

  const goToNext = useCallback(() => {
    if (!isEnrolled && currentLessonIndex === 0) {
      setActiveTab("payment");
      paymentTabRef.current?.scrollIntoView({ behavior: "smooth" });
      toast({ title: "محتوى مقفل", description: "يرجى الاشتراك لتتمكن من إكمال الدورة." });
      return;
    }
    if (lessons && currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      if (!isLessonLocked(nextLesson, currentLessonIndex + 1)) selectLesson(nextLesson.id);
    } else if (isAllLessonsCompleted) {
      setIsFinishing(true);
      setSelectedLessonId(null);
    }
  }, [lessons, currentLessonIndex, isEnrolled, isLessonLocked, selectLesson, isAllLessonsCompleted, toast]);

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
    const userRef = doc(db, "users", user.uid);
    const updates: any = {};
    if (!userProgress.completedLessons?.includes(currentLesson.id)) {
      updates[`progress.${id}.completedLessons`] = arrayUnion(currentLesson.id);
      updates[`progress.${id}.points`] = (userProgress.points || 0) + 10;
    }
    if (score !== undefined && !userProgress.quizScores?.[currentLesson.id]) {
      updates[`progress.${id}.quizScores.${currentLesson.id}`] = score;
      updates[`progress.${id}.points`] = (userProgress.points || 0) + (score * 5);
    }
    if (Object.keys(updates).length > 0) await updateDoc(userRef, updates);
    if (currentLesson.type === "video") setTimeout(goToNext, 1000);
  }, [db, user, currentLesson, isEnrolled, userProgress, id, goToNext]);

  const handleReviewSubmit = async () => {
    if (!db || !user || rating === 0) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى اختيار تقييم النجوم أولاً." });
      return;
    }
    setSubmittingReview(true);
    const reviewData = { 
      courseId: id, 
      courseTitle: course?.title || "دورة سراج", 
      userId: user.uid, 
      userName: profile?.name || "طالب مجهول", 
      userPhoto: profile?.photoURL || "", 
      rating, 
      comment: reviewComment, 
      createdAt: serverTimestamp() 
    };
    addDoc(collection(db, "reviews"), reviewData)
      .then(() => { setIsReviewSubmitted(true); toast({ title: "تم تسجيل تقييمك", description: "شكراً لك!" }); })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'reviews',
          operation: 'create',
          requestResourceData: reviewData
        }));
      })
      .finally(() => setSubmittingReview(false));
  };

  const CurriculumContent = () => (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="space-y-4">
        {Object.entries(groupedLessons).map(([unitTitle, unitLessons]: [string, any], uIdx) => (
          <AccordionItem key={unitTitle} value={`unit-${uIdx}`} className="border rounded-2xl overflow-hidden bg-card border-primary/5">
            <AccordionTrigger className="hover:no-underline py-5 px-5 bg-muted/20 text-right [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-4 text-right">
                <div className="p-2.5 bg-primary text-white rounded-xl shadow-md"><BookOpen className="w-5 h-5" /></div>
                <div className="text-right">
                  <h4 className="text-base font-black text-primary">{unitTitle}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold">{unitLessons.length} عناصر تعليمية</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-3 space-y-1.5" dir="rtl">
              {unitLessons.map((lesson: any, lIdx: number) => {
                const gIndex = lessons?.findIndex(l => l.id === lesson.id) ?? 0;
                const isLocked = isLessonLocked(lesson, gIndex);
                const isActive = selectedLessonId === lesson.id;
                return (
                  <button key={lesson.id} disabled={isLocked} onClick={() => { selectLesson(lesson.id); setIsCurriculumOpen(false); }}
                    className={cn("w-full text-right p-4 rounded-xl flex items-center justify-between transition-all", isActive ? "bg-secondary text-white shadow-lg scale-[1.02]" : "hover:bg-primary/5", isLocked && "opacity-40")}>
                    <div className="flex items-center gap-4 text-right">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs", isActive ? "bg-white/20" : "bg-muted text-primary")}>{lIdx + 1}</div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{lesson.title}</div>
                        <div className="text-[10px] opacity-70 flex items-center gap-1 mt-1 font-bold"><Clock className="w-3.5 h-3.5" /> {lesson.duration} دقيقة</div>
                      </div>
                    </div>
                    <div>{isLocked ? <Lock className="w-4 h-4 opacity-50" /> : userProgress.completedLessons?.includes(lesson.id) ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <PlayCircle className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />}</div>
                  </button>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );

  if (courseLoading || lessonsLoading) {
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
                  <div className="flex justify-between items-center text-[10px] font-black text-primary"><span>تقدمك الحالي</span><span className="text-secondary">{Math.round((userProgress.completedLessons?.length || 0) / (lessons?.length || 1) * 100)}%</span></div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${(userProgress.completedLessons?.length || 0) / (lessons?.length || 1) * 100}%` }} /></div>
               </div>
            </div>
          )}

          <div className="space-y-6">
            {isFinishing ? (
              <div className="bg-white p-6 md:p-16 rounded-[2rem] border-4 border-green-500/10 text-center space-y-8 luxury-shadow animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"><PartyPopper className="w-12 h-12 text-green-600" /></div>
                <h2 className="text-3xl md:text-5xl font-black text-green-800 font-headline">مبارك لك الإنجاز!</h2>
                {!isReviewSubmitted ? (
                  <div className="bg-primary/5 p-6 rounded-[2rem] max-w-2xl mx-auto space-y-6">
                      <p className="font-black text-lg text-primary">يرجى تقييم الدورة لنتمكن من إصدار الشهادة</p>
                      <div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRating(s)}><Star className={cn("w-10 h-10", s <= rating ? "text-secondary fill-secondary" : "text-muted")} /></button>)}</div>
                      <Textarea placeholder="رأيك يهمنا..." className="rounded-2xl" value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
                      <Button disabled={submittingReview} onClick={handleReviewSubmit} className="w-full h-14 bg-primary text-white rounded-2xl font-bold">إرسال التقييم</Button>
                  </div>
                ) : (
                  <div className="bg-primary/5 p-8 rounded-[2rem] max-w-2xl mx-auto space-y-6">
                      {!showCertForm ? (
                        <Button onClick={() => setShowCertForm(true)} className="bg-green-600 text-white h-16 rounded-2xl px-12 font-black text-lg shadow-xl"><Award className="w-6 h-6 ml-2" /> إصدار الشهادة والتوثيق</Button>
                      ) : (
                        <div className="space-y-6 text-right">
                          <Label className="font-black">الاسم الرباعي (بالعربية)</Label>
                          <Input placeholder="الاسم كما في الهوية..." className="h-14 rounded-xl" value={certNameAr} onChange={e => setCertNameAr(e.target.value)} />
                          <Label className="font-black">Full Name (English)</Label>
                          <Input placeholder="In English..." className="h-14 rounded-xl text-left" dir="ltr" value={certNameEn} onChange={e => setCertNameEn(e.target.value)} />
                          <Button onClick={() => {
                            const msg = `طلب شهادة: ${certNameAr} (${certNameEn}) لـ ${course?.title}`;
                            window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`);
                          }} className="w-full h-16 bg-[#25D366] text-white rounded-2xl font-black"><MessageCircle className="w-6 h-6 ml-2" /> تأكيد وإرسال واتساب</Button>
                        </div>
                      )}
                  </div>
                )}
                <Button onClick={goToPrev} variant="ghost" className="text-muted-foreground">العودة للدرس الأخير</Button>
              </div>
            ) : currentLesson && !isLessonLocked(currentLesson, currentLessonIndex) ? (
              <>
                {currentLesson.type === "quiz" ? (
                  <QuizPlayer quizData={currentLesson.quizData || []} alreadyAnswered={!!userProgress.quizScores?.[currentLesson.id]} onComplete={handleLessonComplete} />
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-border luxury-shadow bg-black aspect-video">
                    <VideoPlayer videoId={currentLesson.youtubeId} onComplete={handleLessonComplete} canSeek={isAdmin || userProgress.completedLessons?.includes(currentLesson.id)} key={currentLesson.id} />
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex gap-4 w-full">
                    <Button onClick={goToNext} className={cn("h-14 flex-1 font-black text-lg shadow-xl", !isEnrolled && currentLessonIndex === 0 ? "bg-secondary" : "bg-primary")}>
                      {!isEnrolled && currentLessonIndex === 0 ? "اشترك لفتح البقية" : "الدرس التالي"}
                    </Button>
                    <Button onClick={goToPrev} disabled={currentLessonIndex === 0} variant="outline" className="h-14 flex-1 font-black text-lg">السابق</Button>
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
                 <p className="text-muted-foreground mt-2">يجب إكمال الدروس السابقة أو الاشتراك لتتمكن من المتابعة.</p>
              </div>
            )}
          </div>

          {currentLessonIndex === 0 && !isFinishing && (
            <div ref={paymentTabRef} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <Card className="rounded-[2.5rem] border-none luxury-shadow p-8 bg-white space-y-8">
                <div className="text-right space-y-3">
                  <h1 className="text-3xl md:text-4xl font-black text-primary">{course?.title}</h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">{course?.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "الطلاب", val: course?.studentsCount, icon: Users },
                    { label: "التقييم", val: course?.rating, icon: Star },
                    { label: "المستوى", val: getLevelName(course?.level || "beginner"), icon: Layers },
                    { label: "الشهادة", val: course?.hasCertificate ? "متاحة" : "غير متوفرة", icon: Award },
                  ].map((s, i) => (
                    <div key={i} className="bg-muted/30 p-4 rounded-2xl flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm"><s.icon className="w-5 h-5 text-secondary" /></div>
                      <div className="text-right overflow-hidden">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">{s.label}</p>
                        <p className="text-xs font-bold text-primary truncate">{s.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-8">
                  <p className="text-2xl md:text-4xl font-black text-secondary">{course?.price} <small className="text-sm">ريال</small></p>
                  <Badge variant="outline" className="h-10 px-6 rounded-xl bg-primary/5 text-primary border-primary/10 font-black">
                    {getCategoryName(course?.category || "general")}
                  </Badge>
                </div>
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 bg-card rounded-[2.5rem] border luxury-shadow overflow-hidden">
                <TabsList className="w-full flex h-16 bg-muted/30 p-1.5 border-b">
                  <TabsTrigger value="payment" className="flex-1 font-black text-lg rounded-2xl">تفعيل الدورة</TabsTrigger>
                  <TabsTrigger value="curriculum" className="flex-1 font-black text-lg rounded-2xl">المنهج</TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 font-black text-lg rounded-2xl">التقييمات</TabsTrigger>
                </TabsList>
                <TabsContent value="payment" className="p-8 md:p-12 space-y-8 text-right">
                  <h3 className="text-2xl md:text-4xl font-black text-primary">خطوات التفعيل</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bankAccounts?.map((bank: any, idx: number) => (
                      <div key={idx} className="bg-white p-6 rounded-3xl border border-primary/5 luxury-shadow flex items-center gap-6">
                        <div className="w-16 h-16 relative bg-muted rounded-xl shrink-0">
                          {bank.imageUrl ? <Image src={bank.imageUrl} alt={bank.bankName} fill className="object-cover" /> : <Building2 className="w-8 h-8 opacity-20 m-4" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="font-black text-lg text-primary">{bank.bankName}</h4>
                          <p className="text-xs text-muted-foreground truncate">{bank.accountHolder}</p>
                          <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl mt-2">
                            <code className="text-sm font-black font-mono">{bank.accountNumber}</code>
                            <button onClick={() => { navigator.clipboard.writeText(bank.accountNumber); toast({ title: "تم النسخ" }); }}><Copy className="w-5 h-5 text-secondary" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary/5 p-8 rounded-[2rem] text-center space-y-6">
                    <p className="font-black text-xl">جاهز للبدء؟ أرسل صورة السند الآن</p>
                    <Button asChild className="bg-[#25D366] text-white rounded-2xl h-16 px-12 font-black text-xl shadow-xl">
                      <a href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,'')}?text=أود تفعيل دورة ${course?.title}`} target="_blank"><MessageCircle className="w-7 h-7 ml-3" /> واتساب الإدارة</a>
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="curriculum" className="p-8"><CurriculumContent /></TabsContent>
                <TabsContent value="reviews" className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.length === 0 ? <p className="text-center py-10 text-muted-foreground font-bold">لا توجد تقييمات بعد.</p> : reviews.map((r: any, i: number) => (
                      <div key={i} className="bg-card p-6 rounded-3xl border luxury-shadow space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12"><AvatarImage src={r.userPhoto} className="object-cover" /><AvatarFallback>{r.userName?.charAt(0)}</AvatarFallback></Avatar>
                          <div className="text-right"><div className="font-black text-primary">{r.userName}</div><div className="flex gap-0.5">{[...Array(5)].map((_, s) => <Star key={s} className={cn("w-3 h-3", s < r.rating ? "text-secondary fill-secondary" : "text-muted")} />)}</div></div>
                        </div>
                        <p className="text-sm text-muted-foreground font-bold italic">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
