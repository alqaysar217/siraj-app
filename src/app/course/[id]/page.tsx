
"use client";

import { useState, use, useEffect, useMemo, useRef, useCallback } from "react";
import Navbar from "@/components/navbar";
import VideoPlayer from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlayCircle, 
  BookOpen, 
  Clock, 
  Loader2, 
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
  ArrowRight,
  MessageSquare,
  User as UserIcon,
  Send,
  ChevronLeft,
  Info,
  FileText,
  CreditCard,
  ShieldAlert,
  BadgeCheck
} from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, query, updateDoc, arrayUnion, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
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
            تنبيه: يتم احتساب نقاط هذا التقويم من أول محاولة إجابة فقط.
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
    const pointsEarned = 10 + (score * 5); // 10 للإنهاء + 5 لكل سؤال صح

    return (
      <div className="bg-card p-6 md:p-12 rounded-[2rem] border border-border text-center space-y-8 luxury-shadow animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-muted/30">
          {isSuccess ? <PartyPopper className="w-12 h-12 text-secondary" /> : <XCircle className="w-12 h-12 text-destructive" />}
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-4xl font-black text-primary font-headline">
              {isSuccess ? "أحسنت يا بطل! 🎉" : "محاولة جيدة"}
            </h2>
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
        </div>
        <Button onClick={reset} variant="outline" className="gap-2 rounded-2xl h-14 px-10 font-black border-primary/10">
          <RotateCcw className="w-5 h-5" /> مراجعة التقويم ثانية
        </Button>
      </div>
    );
  }

  const q = quizData[currentStep];

  return (
    <div className="bg-card p-5 md:p-12 rounded-[2rem] border border-border luxury-shadow space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b border-border/50 pb-6">
        <span className="text-lg md:text-2xl font-black text-primary font-headline">تقويم الوحدة</span>
        <span className="text-[10px] font-black bg-primary/5 text-primary px-3 py-1.5 rounded-full">سؤال {currentStep + 1} من {quizData.length}</span>
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
                  "flex items-center justify-between p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 text-right",
                  isSelected ? "border-secondary bg-secondary/5 shadow-md" : "border-muted hover:border-secondary/20"
                )}>
                <span className={cn("text-sm md:text-xl font-bold", isSelected ? "text-primary" : "text-muted-foreground")}>{opt}</span>
                <div className={cn("w-6 h-6 rounded-full border-2", isSelected ? "border-secondary bg-secondary" : "border-muted")} />
              </button>
            );
          })}
        </div>
      </div>
      <Button disabled={!answers[currentStep]} onClick={next} className="w-full h-14 bg-primary text-white rounded-2xl text-lg font-black">
        {currentStep === quizData.length - 1 ? "إنهاء النتيجة" : "التالي"}
      </Button>
    </div>
  );
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { profile, user, isAdmin, loading: userLoading } = useUser();
  const { toast } = useToast();
  const hasInitializedRef = useRef(false);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const courseRef = useMemoFirebase(() => db ? doc(db, "courses", id) : null, [db, id]);
  const { data: course, loading: courseLoading } = useDoc(courseRef);

  const lessonsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "courses", id, "lessons"), orderBy("order", "asc")) : null
  , [db, id]);
  const { data: lessons, loading: lessonsLoading } = useCollection(lessonsQuery);

  const bankQuery = useMemoFirebase(() => db ? collection(db, "bankAccounts") : null, [db]);
  const { data: bankAccounts } = useCollection(bankQuery);

  const reviewsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "reviews"), where("courseId", "==", id)) : null
  , [db, id]);
  const { data: rawReviews, loading: reviewsLoading } = useCollection(reviewsQuery);

  const courseReviews = useMemo(() => {
    if (!rawReviews) return [];
    return [...rawReviews]
      .filter((r: any) => r.status !== 'hidden' || isAdmin)
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
  }, [rawReviews, isAdmin]);

  useEffect(() => {
    if (courseReviews && user) {
      const existing = courseReviews.find((r: any) => r.userId === user.uid);
      if (existing) setHasReviewed(true);
    }
  }, [courseReviews, user]);

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

  const isAllLessonsCompleted = useMemo(() => {
    if (!lessons || lessons.length === 0) return false;
    return allCompletedIds.length >= lessons.length;
  }, [lessons, allCompletedIds]);

  // خوارزمية المتابعة الذكية المطورة (Smart Following Algorithm)
  useEffect(() => {
    if (!userLoading && !lessonsLoading && lessons?.length && !hasInitializedRef.current) {
      // 1. تحديد الدروس المكتملة فعلياً
      const completed = Array.isArray(profile?.progress?.[id]?.completedLessons) 
        ? profile.progress[id].completedLessons 
        : [];
      
      // 2. البحث عن أول درس غير مكتمل في المنهج بالترتيب
      const firstUncompleted = lessons.find(l => !completed.includes(l.id));

      if (firstUncompleted) {
        // وجدنا درساً لم يشاهده بعد، ننتقل إليه فوراً
        setSelectedLessonId(firstUncompleted.id);
      } else if (completed.length >= lessons.length && lessons.length > 0) {
        // إذا كان كل شيء مكتملاً، نظهر شاشة النهاية
        setIsFinishing(true);
        setSelectedLessonId(null);
      } else {
        // حالة احتياطية (مثل الضيوف أو عند عدم وجود دروس مكتملة أصلاً)
        setSelectedLessonId(lessons[0].id);
      }

      setLocalCompleted(completed);
      hasInitializedRef.current = true;
    }
  }, [lessons, lessonsLoading, profile, id, userLoading]);

  const selectLesson = useCallback((lessonId: string) => {
    setIsFinishing(false);
    setSelectedLessonId(lessonId);
    if (db && user && isEnrolled) {
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, { [`progress.${id}.lastLessonId`]: lessonId }).catch(() => {});
    }
  }, [db, user, isEnrolled, id]);

  const isLessonLocked = useCallback((lesson: any, index: number) => {
    if (isAdmin) return false;
    if (allCompletedIds.includes(lesson.id)) return false;
    if (index === 0) return false;
    const prevLesson = lessons?.[index - 1];
    return !allCompletedIds.includes(prevLesson?.id);
  }, [isAdmin, allCompletedIds, lessons]);

  const whatsappMessage = `أهلاً سراج، أنا الطالب (${profile?.name || 'جديد'}) ببريد (${profile?.email || 'غير مسجل'})، أود الاشتراك وتفعيل دورة: ${course?.title}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  const goToNext = useCallback(() => {
    if (!isEnrolled && currentLessonIndex === 0) {
      window.open(whatsappUrl, '_blank');
      return;
    }
    if (lessons && currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      selectLesson(nextLesson.id);
    } else if (isAllLessonsCompleted) {
      setIsFinishing(true);
      setSelectedLessonId(null);
    }
  }, [lessons, currentLessonIndex, isEnrolled, selectLesson, isAllLessonsCompleted, whatsappUrl]);

  const goToPrev = () => {
    if (isFinishing) {
      setIsFinishing(false);
      setSelectedLessonId(lessons?.[lessons.length - 1]?.id || null);
    } else if (currentLessonIndex > 0) {
      setSelectedLessonId(lessons![currentLessonIndex - 1].id);
    }
  };

  const handleLessonComplete = useCallback(async (score?: number) => {
    if (!db || !user || !currentLesson || !isEnrolled || !profile) return;
    
    const lessonId = currentLesson.id;
    const isNewCompletion = !userProgress.completedLessons?.includes(lessonId);

    if (isNewCompletion && !localCompleted.includes(lessonId)) {
      setLocalCompleted(prev => [...prev, lessonId]);
    }

    const userRef = doc(db, "users", user.uid);
    const updates: any = {};
    let totalPointsToAdd = 0;
    
    if (isNewCompletion) {
      updates[`progress.${id}.completedLessons`] = arrayUnion(lessonId);
      totalPointsToAdd += 10;
    }
    
    if (score !== undefined && !userProgress.quizScores?.[lessonId]) {
      updates[`progress.${id}.quizScores.${lessonId}`] = score;
      totalPointsToAdd += (score * 5);
    }
    
    if (totalPointsToAdd > 0) {
      const currentTotalPoints = Number(profile.points || 0);
      const currentCoursePoints = Number(userProgress.points || 0);
      updates[`points`] = currentTotalPoints + totalPointsToAdd;
      updates[`progress.${id}.points`] = currentCoursePoints + totalPointsToAdd;
    }
    
    if (Object.keys(updates).length > 0) {
      updateDoc(userRef, updates).catch(() => {});
    }
    
    if (currentLesson.type === "video") {
      setTimeout(goToNext, 2000);
    }
  }, [db, user, currentLesson, isEnrolled, userProgress, id, goToNext, profile, localCompleted]);

  const handleAddReview = async () => {
    if (!db || !user || !profile || !id) return;
    if (!reviewComment.trim()) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى كتابة رأيك قبل الإرسال." });
      return;
    }

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        userId: user.uid,
        userName: profile.name,
        userPhoto: profile.photoURL || "",
        courseId: id,
        courseTitle: course?.title || "دورة",
        rating: reviewRating,
        comment: reviewComment,
        status: 'visible',
        createdAt: serverTimestamp()
      });
      setHasReviewed(true);
      toast({ title: "تم الإرسال", description: "شكراً لمشاركتك رأيك القوي معنا!" });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "حدثت مشكلة أثناء حفظ التقييم." });
    } finally {
      setSubmittingReview(false);
    }
  };

  const CurriculumList = () => (
    <div className="space-y-6" dir="rtl">
      <Accordion type="single" collapsible className="space-y-4">
        {lessons && lessons.length > 0 ? Object.entries(
          lessons.reduce((acc: any, lesson: any) => {
            const unit = lesson.unitTitle || "مقدمة المنهج";
            if (!acc[unit]) acc[unit] = [];
            acc[unit].push(lesson);
            return acc;
          }, {})
        ).map(([unitTitle, unitLessons]: [string, any], uIdx) => (
          <AccordionItem key={unitTitle} value={`unit-${uIdx}`} className="border rounded-2xl overflow-hidden bg-card border-primary/5">
            <AccordionTrigger className="hover:no-underline py-5 px-5 bg-muted/20 text-right [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-4 text-right">
                <div className="p-2.5 bg-primary text-white rounded-xl shadow-md shrink-0"><BookOpen className="w-5 h-5" /></div>
                <div className="text-right flex-1">
                  <h4 className="text-base font-black text-primary">{unitTitle}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold">{unitLessons.length} عناصر</p>
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
                    <div className="flex items-center gap-4 text-right">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0", isActive ? "bg-white/20" : "bg-muted text-primary")}>{lIdx + 1}</div>
                      <div className="text-right flex-1">
                        <div className="text-sm font-bold">{lesson.title}</div>
                      </div>
                    </div>
                    <div className="shrink-0">{isLocked ? <Lock className="w-4 h-4 opacity-50" /> : isDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <PlayCircle className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary")} />}</div>
                  </button>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        )) : (
          <div className="text-center py-10 opacity-40 italic text-sm font-bold">
            لم يتم رفع دروس لهذه الدورة بعد.
          </div>
        )}

        {lessons && lessons.length > 0 && (
          <div className="mt-4 border rounded-2xl overflow-hidden bg-card border-secondary/20 luxury-shadow">
            <button 
              disabled={!isAllLessonsCompleted}
              onClick={() => { setIsFinishing(true); setSelectedLessonId(null); setIsCurriculumOpen(false); }}
              className={cn(
                "w-full text-right p-6 flex items-center justify-between transition-all",
                isFinishing ? "bg-primary text-white" : "bg-muted/10",
                !isAllLessonsCompleted && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl shadow-md shrink-0", isAllLessonsCompleted ? "bg-secondary text-white" : "bg-muted text-muted-foreground")}>
                  {isAllLessonsCompleted ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div className="text-right">
                  <h4 className="text-base font-black">الخطوة الأخيرة: التقييم والشهادة</h4>
                  <p className="text-[10px] font-bold opacity-70">
                    {isAllLessonsCompleted ? "افتح الآن لاستلام إنجازك" : "ستُفتح بعد إتمام كافة الدروس"}
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </Accordion>
    </div>
  );

  if (courseLoading || userLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        </div>
      </div>
    );
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
                  <div className="flex justify-between items-center text-[10px] font-black text-primary">
                    <span>تقدمك في المنهج</span>
                    <span className="text-secondary">{Math.round(allCompletedIds.length / (lessons?.length || 1) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${Math.round(allCompletedIds.length / (lessons?.length || 1) * 100)}%` }} />
                  </div>
               </div>
            </div>
          )}

          <div className="space-y-6">
            {isFinishing ? (
              <div className="space-y-6 animate-in zoom-in duration-500">
                <Card className="bg-white p-6 md:p-12 rounded-[2rem] border-4 border-green-500/10 text-center space-y-8 luxury-shadow">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"><PartyPopper className="w-12 h-12 text-green-600" /></div>
                  <div className="space-y-2">
                    <h2 className="text-2xl md:text-4xl font-black text-green-800 font-headline">مبارك لك الإنجاز الكبير! 🎓</h2>
                    <p className="text-muted-foreground font-bold">لقد أكملت كافة متطلبات دورة "{course?.title}" بنجاح.</p>
                  </div>
                  <Button onClick={() => window.open(whatsappUrl, '_blank')} className="bg-[#25D366] text-white h-16 rounded-2xl px-12 font-black text-lg gap-2 shadow-xl shadow-green-600/20">
                    <Award className="w-6 h-6" /> طلب الشهادة الموثقة عبر واتساب
                  </Button>
                </Card>

                {!hasReviewed && (
                  <Card className="bg-card p-6 md:p-10 rounded-[2rem] border border-secondary/20 luxury-shadow space-y-6">
                    <h3 className="text-xl md:text-2xl font-black text-primary font-headline flex items-center gap-3">
                      <Star className="w-6 h-6 text-secondary fill-secondary" />
                      قيم تجربتك في هذه الدورة
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setReviewRating(s)} className="p-1 transition-transform hover:scale-125">
                            <Star className={cn("w-8 h-8 md:w-10 md:h-10", s <= reviewRating ? "text-secondary fill-secondary" : "text-muted")} />
                          </button>
                        ))}
                      </div>
                      <Textarea 
                        placeholder="اكتب رأيك بصراحة.. ما الذي أعجبك؟ وكيف يمكننا التحسين؟"
                        className="min-h-[120px] rounded-2xl border-primary/10 text-base text-right"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                      <Button disabled={submittingReview} onClick={handleAddReview} className="w-full h-14 bg-primary text-white rounded-2xl font-black gap-2">
                        {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        إرسال التقييم ونشره
                      </Button>
                    </div>
                  </Card>
                )}
                
                <Button onClick={goToPrev} variant="ghost" className="text-muted-foreground block mx-auto font-bold">العودة لمراجعة المنهج</Button>
              </div>
            ) : currentLesson ? (
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
                    <Button 
                      onClick={goToNext} 
                      className={cn("h-14 flex-1 font-black text-lg shadow-xl gap-2", !isEnrolled && currentLessonIndex === 0 ? "bg-secondary" : "bg-primary")}
                    >
                      <ArrowRight className="w-5 h-5 ml-1" />
                      <span>{(!isEnrolled && currentLessonIndex === 0) ? "اشترك لفتح البقية" : "الدرس التالي"}</span>
                    </Button>
                    <Button onClick={goToPrev} disabled={currentLessonIndex === 0} variant="outline" className="h-14 flex-1 font-black text-lg gap-2">
                       <span>السابق</span>
                    </Button>
                  </div>
                  <Sheet open={isCurriculumOpen} onOpenChange={setIsCurriculumOpen}>
                    <Button onClick={() => setIsCurriculumOpen(true)} variant="secondary" className="h-14 w-full font-black text-lg gap-3 bg-secondary text-white"><ListVideo className="w-6 h-6" /> عرض المنهج والدروس</Button>
                    <SheetContent side="right" className="w-[90%] sm:max-w-md p-0 overflow-y-auto" dir="rtl">
                      <SheetHeader className="p-8 border-b text-right bg-muted/10">
                        <SheetTitle className="text-2xl font-black">منهج الدورة</SheetTitle>
                      </SheetHeader>
                      <div className="p-6"><CurriculumList /></div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="rounded-[2.5rem] aspect-video bg-card border-2 border-dashed border-primary/10 flex flex-col items-center justify-center p-8 text-center">
                 <Lock className="w-16 h-16 text-primary opacity-40 mb-4" />
                 <h2 className="text-2xl font-black text-primary">المحتوى التعليمي سيتم توفره قريباً</h2>
                 <p className="text-muted-foreground font-bold mt-2">يعمل فريق سراج حالياً على رفع وتجهيز الدروس لهذه الدورة.</p>
                 <Button asChild variant="outline" className="mt-6 rounded-xl border-primary/10 text-primary">
                    <a href={whatsappUrl} target="_blank">الاشتراك/تفعيل</a>
                 </Button>
              </div>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <Tabs dir="rtl" value={activeTab} onValueChange={setActiveTab} className="bg-card rounded-[2rem] border luxury-shadow overflow-hidden">
              <TabsList className="w-full flex h-14 md:h-16 bg-muted/30 p-1 md:p-1.5 border-b gap-1">
                <TabsTrigger value="details" className="flex-1 font-black text-xs md:text-base rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Info className="w-4 h-4 md:w-5 md:h-5" /> <span>عن الدورة</span>
                </TabsTrigger>
                <TabsTrigger value="curriculum" className="flex-1 font-black text-xs md:text-base rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <ListVideo className="w-4 h-4 md:w-5 md:h-5" /> <span>المنهج</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 font-black text-xs md:text-base rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5" /> <span>التقييمات</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="p-6 md:p-10 space-y-10 animate-in fade-in duration-300">
                <section className="space-y-4 text-right">
                  <h3 className="text-2xl font-black text-primary font-headline flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-xl text-secondary"><FileText className="w-6 h-6" /></div>
                    وصف الدورة التدريبية
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium whitespace-pre-line pr-2">
                    {course?.description}
                  </p>
                </section>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "إجمالي الطلاب", val: course?.studentsCount, icon: Users },
                    { label: "التقييم العام", val: course?.rating, icon: Star },
                    { label: "المستوى", val: getLevelName(course?.level || "beginner"), icon: Layers },
                    { label: "شهادة معتمدة", val: course?.hasCertificate ? "متاحة" : "غير متوفرة", icon: Award },
                  ].map((s, i) => (
                    <div key={i} className="bg-muted/30 p-5 rounded-[1.5rem] flex items-center gap-3 border border-primary/5">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm shrink-0"><s.icon className="w-6 h-6 text-secondary" /></div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase">{s.label}</p>
                        <p className="text-sm font-bold text-primary">{s.val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <section className="space-y-6 pt-10 border-t border-primary/5">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-xl md:text-2xl font-black text-primary font-headline flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-secondary" />
                      طريقة الاشتراك والتفعيل
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bankAccounts?.map((bank: any, idx: number) => (
                      <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-primary/5 luxury-shadow flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group hover:border-secondary/20 transition-all">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/5 rounded-full -mr-10 -mt-10 group-hover:bg-secondary/10 transition-colors" />
                        
                        <div className="w-20 h-20 relative bg-muted/30 rounded-3xl shrink-0 overflow-hidden border border-primary/5">
                          {bank.imageUrl ? (
                            <Image src={bank.imageUrl} alt={bank.bankName} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/20"><Building2 className="w-10 h-10" /></div>
                          )}
                        </div>
                        
                        <div className="flex-1 text-center md:text-right space-y-2 overflow-hidden w-full">
                          <h4 className="font-black text-lg text-primary leading-none">{bank.bankName}</h4>
                          <div className="space-y-0.5">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">اسم صاحب الحساب</p>
                             <p className="text-sm font-black text-primary/80">{bank.accountHolder}</p>
                          </div>
                          <div className="bg-primary/5 p-3 rounded-2xl border border-primary/5 inline-block w-full">
                             <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">رقم الحساب</p>
                             <code className="text-base font-black font-mono text-secondary block" dir="ltr">{bank.accountNumber}</code>
                          </div>
                          <Button 
                            onClick={() => { navigator.clipboard.writeText(bank.accountNumber); toast({ title: "تم النسخ", description: "رقم الحساب جاهز للصق" }); }} 
                            variant="ghost"
                            className="w-full h-10 rounded-xl mt-2 flex items-center justify-center gap-2 text-xs font-black text-primary hover:bg-primary/5 hover:text-secondary"
                          >
                             <Copy className="w-4 h-4" /> نسخ رقم الحساب
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-secondary/5 p-6 rounded-[2rem] border border-dashed border-secondary/20 text-center space-y-3">
                     <p className="text-sm md:text-base text-primary font-bold leading-relaxed">
                        للبدء في رحلتك التعليمية وفتح كافة دروس المنهج، يرجى الضغط على الزر أدناه للتواصل معنا وطلب التفعيل المباشر لحسابك.
                     </p>
                     <Button asChild className="bg-[#25D366] hover:bg-[#25D366]/90 text-white font-black h-12 rounded-xl px-8 gap-2 shadow-lg">
                        <a href={whatsappUrl} target="_blank">
                           <MessageCircle className="w-5 h-5" /> الاشتراك/تفعيل
                        </a>
                     </Button>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="curriculum" className="p-6 md:p-8 animate-in fade-in duration-300">
                <CurriculumList />
              </TabsContent>

              <TabsContent value="reviews" className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-primary font-headline">آراء الطلاب</h3>
                    <div className="flex items-center gap-1.5 bg-secondary/10 px-4 py-1.5 rounded-full">
                       <Star className="w-4 h-4 text-secondary fill-secondary" />
                       <span className="font-black text-secondary">{course?.rating || "5.0"}</span>
                    </div>
                 </div>
                 
                 {reviewsLoading ? (
                   <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-secondary" /></div>
                 ) : courseReviews && courseReviews.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {courseReviews.map((review: any, i: number) => (
                       <div key={i} className={cn("bg-white p-6 rounded-3xl border border-primary/5 luxury-shadow space-y-4 relative", review.status === 'hidden' && "border-red-200 bg-red-50/10")}>
                          {review.status === 'hidden' && isAdmin && (
                            <Badge variant="destructive" className="absolute top-4 left-4 h-5 text-[8px] gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" /> تعليق مخفي (يراه المسؤول فقط)
                            </Badge>
                          )}
                          <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10 border border-primary/10 shadow-sm">
                                <AvatarImage src={review.userPhoto || undefined} className="object-cover" />
                                <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">{review.userName?.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <div className="text-right">
                                <div className="text-sm font-black text-primary">{review.userName}</div>
                                <div className="flex items-center gap-0.5 mt-0.5">
                                   {[...Array(5)].map((_, s) => (
                                     <Star key={s} className={cn("w-2.5 h-2.5", s < review.rating ? "text-secondary fill-secondary" : "text-muted")} />
                                   ))}
                                </div>
                             </div>
                          </div>
                          <p className="text-xs text-muted-foreground font-bold italic leading-relaxed">"{review.comment}"</p>
                          
                          {review.adminReply && (
                            <div className="mt-4 p-4 bg-primary/5 rounded-2xl border-r-4 border-secondary text-right animate-in slide-in-from-right-2 duration-500">
                               <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-6 w-6 border border-secondary/20 shadow-sm">
                                     <AvatarImage src="/logo.png" className="object-contain p-1" />
                                     <AvatarFallback className="bg-secondary text-white text-[8px]">إدارة</AvatarFallback>                                  </Avatar>
                                  <div className="flex items-center gap-1">
                                     <span className="text-[10px] font-black text-secondary uppercase tracking-wider">رد إدارة سراج</span>
                                     <ShieldCheck className="w-3 h-3 text-blue-500 fill-blue-50" />
                                  </div>
                               </div>
                               <p className="text-xs text-primary font-bold leading-relaxed">{review.adminReply}</p>
                            </div>
                          )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="py-20 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-primary/5">
                      <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground font-black">كن أول من يشارك رأيه حول هذه الدورة!</p>
                   </div>
                 )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
