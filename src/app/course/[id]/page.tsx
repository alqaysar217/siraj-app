
'use client';

import { useState, use, useEffect, useMemo, useRef, useCallback } from "react";
import Navbar from "@/components/navbar";
import VideoPlayer from "@/components/video-player";
import QuizPlayer from "@/components/course/quiz-player";
import CurriculumAccordion from "@/components/course/curriculum-accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  Loader2, 
  Star, 
  Award, 
  Lock, 
  MessageCircle, 
  Copy, 
  Trophy, 
  Layers, 
  ShieldCheck, 
  ListVideo, 
  PartyPopper, 
  Building2, 
  ArrowRight, 
  MessageSquare, 
  Info, 
  FileText, 
  CreditCard
} from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, query, updateDoc, arrayUnion, where, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const WHATSAPP_NUMBER = "+967735952927";

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { profile, user, isAdmin, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const hasInitializedRef = useRef(false);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const { data: rawReviews } = useCollection(reviewsQuery);

  const courseReviews = useMemo(() => {
    if (!rawReviews) return [];
    return [...rawReviews]
      .filter((r: any) => r.status !== 'hidden' || isAdmin)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawReviews, isAdmin]);

  const isEnrolled = useMemo(() => {
    if (isAdmin) return true;
    return Array.isArray(profile?.enrolledCourses) && profile.enrolledCourses.includes(id);
  }, [profile, id, isAdmin]);

  const userProgress = useMemo(() => profile?.progress?.[id] || { completedLessons: [], points: 0, quizScores: {}, lastLessonId: null }, [profile, id]);
  const allCompletedIds = useMemo(() => Array.from(new Set([...(userProgress.completedLessons || []), ...localCompleted])), [userProgress.completedLessons, localCompleted]);
  
  const currentLessonIndex = useMemo(() => lessons?.findIndex(l => l.id === selectedLessonId) ?? -1, [lessons, selectedLessonId]);
  const currentLesson = lessons?.[currentLessonIndex];
  const isAllLessonsCompleted = useMemo(() => lessons && lessons.length > 0 && allCompletedIds.length >= lessons.length, [lessons, allCompletedIds]);

  const whatsappMessage = `أهلاً سراج، أنا الطالب (${profile?.name || 'جديد'}) ببريد (${profile?.email || 'غير مسجل'})، أود الاشتراك وتفعيل دورة: ${course?.title}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  // ميزة الاستئناف التلقائي: تفتح أول درس غير مكتمل عند تحديث الصفحة
  useEffect(() => {
    if (userLoading || courseLoading || !lessons || !mounted || hasInitializedRef.current) return;
    
    const completedIdsFromProfile = profile?.progress?.[id]?.completedLessons || [];
    
    if (!isEnrolled && lessons.length > 0) {
      setSelectedLessonId(lessons[0].id);
      hasInitializedRef.current = true;
      return;
    }

    const nextUncompletedLesson = lessons.find(l => !completedIdsFromProfile.includes(l.id));

    if (nextUncompletedLesson) {
      setSelectedLessonId(nextUncompletedLesson.id);
      setIsFinishing(false);
    } else if (lessons.length > 0) {
      setIsFinishing(true);
      setSelectedLessonId(null);
    }

    setLocalCompleted(completedIdsFromProfile);
    hasInitializedRef.current = true;
  }, [lessons, profile, id, userLoading, courseLoading, mounted, isEnrolled]);

  const selectLesson = useCallback((lessonId: string) => {
    setIsFinishing(false);
    setSelectedLessonId(lessonId);
  }, []);

  const isLessonLocked = useCallback((lesson: any, index: number) => {
    if (isAdmin) return false;
    if (allCompletedIds.includes(lesson.id)) return false;
    if (index === 0) return false;
    return !allCompletedIds.includes(lessons?.[index - 1]?.id);
  }, [isAdmin, allCompletedIds, lessons]);

  const goToNext = useCallback(() => {
    if (!isEnrolled && currentLessonIndex === 0) {
      window.open(whatsappUrl, '_blank');
      return;
    }

    // التحقق الصارم: هل الدرس الحالي مكتمل؟
    const isCurrentCompleted = currentLesson && allCompletedIds.includes(currentLesson.id);
    if (!isAdmin && !isCurrentCompleted) {
      toast({
        variant: "destructive",
        title: "تنبيه التعليمات",
        description: "يرجى إكمال الدرس الحالي (مشاهدة الفيديو أو حل التقويم) لتتمكن من الانتقال للدرس التالي."
      });
      return;
    }

    if (lessons && currentLessonIndex < lessons.length - 1) {
      selectLesson(lessons[currentLessonIndex + 1].id);
    } else if (isAllLessonsCompleted) {
      setIsFinishing(true);
      setSelectedLessonId(null);
    }
  }, [lessons, currentLessonIndex, isEnrolled, selectLesson, isAllLessonsCompleted, whatsappUrl, currentLesson, allCompletedIds, isAdmin, toast]);

  const handleLessonComplete = useCallback(async (score?: number) => {
    if (!db || !user || !currentLesson || !isEnrolled || !profile) return;
    const lessonId = currentLesson.id;
    const isNew = !userProgress.completedLessons?.includes(lessonId);
    
    if (isNew && !localCompleted.includes(lessonId)) {
      setLocalCompleted(prev => [...prev, lessonId]);
    }

    const updates: any = {};
    let pts = 0;
    
    if (isNew) { 
      updates[`progress.${id}.completedLessons`] = arrayUnion(lessonId); 
      pts += 10; 
    }
    
    if (score !== undefined && !userProgress.quizScores?.[lessonId]) { 
      updates[`progress.${id}.quizScores.${lessonId}`] = score; 
      pts += (score * 5); 
    }
    
    if (pts > 0) { 
      updates[`points`] = Number(profile.points || 0) + pts; 
      updates[`progress.${id}.points`] = Number(userProgress.points || 0) + pts; 
    }
    
    if (Object.keys(updates).length > 0) {
      updateDoc(doc(db, "users", user.uid), updates).catch(() => {});
    }

    // الانتقال التلقائي للفيديو فقط بعد الإكمال
    if (currentLesson.type === "video") {
      setTimeout(goToNext, 2000);
    }
  }, [db, user, currentLesson, isEnrolled, userProgress, id, goToNext, profile, localCompleted]);

  if (!mounted || courseLoading || userLoading) {
    return <div className="min-h-screen flex flex-col bg-background"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-secondary" /></div></div>;
  }

  const isCurrentLessonCompleted = currentLesson && allCompletedIds.includes(currentLesson.id);

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-5xl space-y-6">
        {isEnrolled && (
          <div className="w-full bg-white/95 backdrop-blur-xl border border-primary/10 p-4 rounded-2xl luxury-shadow flex items-center gap-4">
             <div className="p-2 bg-secondary/10 rounded-lg shrink-0"><ShieldCheck className="w-5 h-5 text-secondary" /></div>
             <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-black text-primary"><span>تقدمك الدراسي</span><span className="text-secondary">{Math.round(allCompletedIds.length / (lessons?.length || 1) * 100)}%</span></div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${Math.round(allCompletedIds.length / (lessons?.length || 1) * 100)}%` }} /></div>
             </div>
          </div>
        )}

        <div className="space-y-6">
          {isFinishing ? (
            <div className="space-y-6 animate-in zoom-in duration-500">
              <Card className="bg-white p-6 md:p-12 rounded-[2rem] border-4 border-green-500/10 text-center space-y-8 luxury-shadow">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"><PartyPopper className="w-12 h-12 text-green-600" /></div>
                <h2 className="text-2xl md:text-4xl font-black text-green-800 font-headline">مبارك لك الإنجاز! 🎓</h2>
                <Button onClick={() => window.open(whatsappUrl, '_blank')} className="bg-[#25D366] text-white h-16 rounded-2xl px-12 font-black text-lg gap-2 shadow-xl shadow-green-600/20"><Award className="w-6 h-6" /> طلب الشهادة الموثقة</Button>
              </Card>
              <Button onClick={() => { setIsFinishing(false); selectLesson(lessons?.[lessons.length-1]?.id || ""); }} variant="ghost" className="text-muted-foreground block mx-auto font-bold">مراجعة المنهج</Button>
            </div>
          ) : currentLesson ? (
            <>
              {currentLesson.type === "quiz" ? (
                <QuizPlayer 
                  quizData={currentLesson.quizData || []} 
                  alreadyAnswered={!!userProgress.quizScores?.[currentLesson.id]} 
                  previousScore={userProgress.quizScores?.[currentLesson.id]}
                  onComplete={handleLessonComplete} 
                  key={currentLesson.id}
                />
              ) : (
                <div className="rounded-2xl overflow-hidden luxury-shadow bg-black aspect-video">
                  <VideoPlayer videoId={currentLesson.youtubeId} onComplete={handleLessonComplete} canSeek={isAdmin || allCompletedIds.includes(currentLesson.id)} key={currentLesson.id} />
                </div>
              )}
              
              <div className="flex gap-4">
                <Button 
                  onClick={goToNext} 
                  className={cn(
                    "h-14 flex-1 font-black text-lg shadow-xl gap-2", 
                    (!isEnrolled && currentLessonIndex === 0) ? "bg-secondary" : 
                    (!isCurrentLessonCompleted && !isAdmin) ? "bg-muted text-muted-foreground cursor-not-allowed opacity-70" : "bg-primary"
                  )}
                >
                   <ArrowRight className="w-5 h-5 ml-1" />
                   <span>{(!isEnrolled && currentLessonIndex === 0) ? "الاشتراك/تفعيل" : "الدرس التالي"}</span>
                   {!isCurrentLessonCompleted && !isAdmin && isEnrolled && <Lock className="w-4 h-4" />}
                </Button>
                <Button onClick={() => currentLessonIndex > 0 && selectLesson(lessons![currentLessonIndex-1].id)} disabled={currentLessonIndex === 0} variant="outline" className="h-14 flex-1 font-black text-lg">السابق</Button>
              </div>
              <Button onClick={() => setIsCurriculumOpen(true)} variant="secondary" className="h-14 w-full font-black text-lg gap-3 bg-secondary text-white"><ListVideo className="w-6 h-6" /> عرض المنهج</Button>
            </>
          ) : <div className="rounded-[2.5rem] aspect-video bg-card border-2 border-dashed border-primary/10 flex flex-col items-center justify-center p-8 text-center"><Lock className="w-16 h-16 text-primary opacity-40 mb-4" /><h2 className="text-2xl font-black text-primary">المحتوى قريباً</h2><p className="text-muted-foreground font-bold">يعمل فريق سراج حالياً على تجهيز المنهج.</p></div>}
        </div>

        <Tabs dir="rtl" value={activeTab} onValueChange={setActiveTab} className="bg-card rounded-[2rem] border luxury-shadow overflow-hidden">
          <TabsList className="w-full flex h-14 md:h-16 bg-muted/30 p-1 md:p-1.5 border-b gap-1">
            <TabsTrigger value="details" className="flex-1 font-black text-xs md:text-base rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><Info className="w-4 h-4 md:w-5" /> عن الدورة</TabsTrigger>
            <TabsTrigger value="curriculum" className="flex-1 font-black text-xs md:text-base rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><ListVideo className="w-4 h-4 md:w-5" /> المنهج</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 font-black text-xs md:text-base rounded-xl gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"><MessageSquare className="w-4 h-4 md:w-5" /> التقييمات</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-6 md:p-10 space-y-10">
            <section className="space-y-4"><h3 className="text-2xl font-black text-primary font-headline flex items-center gap-3"><div className="p-2 bg-secondary/10 rounded-xl text-secondary"><FileText className="w-6 h-6" /></div>وصف الدورة</h3><p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{course?.description}</p></section>
            <section className="space-y-6 pt-10 border-t border-primary/5"><h3 className="text-xl md:text-2xl font-black text-primary font-headline flex items-center gap-3"><CreditCard className="w-6 h-6 text-secondary" />طريقة الاشتراك</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{bankAccounts?.map((bank: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-primary/5 luxury-shadow flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group hover:border-secondary/20 transition-all"><div className="w-20 h-20 relative bg-muted/30 rounded-3xl shrink-0 overflow-hidden border border-primary/5">{bank.imageUrl ? <Image src={bank.imageUrl} alt={bank.bankName} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary/20"><Building2 className="w-10 h-10" /></div>}</div>
              <div className="flex-1 text-center md:text-right space-y-2 overflow-hidden w-full"><h4 className="font-black text-lg text-primary">{bank.bankName}</h4><p className="text-[10px] font-bold text-muted-foreground uppercase">{bank.accountHolder}</p><div className="bg-primary/5 p-3 rounded-2xl border border-primary/5 inline-block w-full"><code className="text-base font-black font-mono text-secondary block" dir="ltr">{bank.accountNumber}</code></div>
              <Button onClick={() => { navigator.clipboard.writeText(bank.accountNumber); toast({ title: "تم النسخ" }); }} variant="ghost" className="w-full h-10 rounded-xl mt-2 flex items-center justify-center gap-2 text-xs font-black text-primary hover:bg-primary/5"><Copy className="w-4 h-4" /> نسخ الرقم</Button></div></div>))}</div>
            <div className="bg-secondary/5 p-6 rounded-[2rem] border border-dashed border-secondary/20 text-center space-y-3"><p className="text-sm md:text-base text-primary font-bold">للبدء في رحلتك التعليمية وفتح كافة دروس المنهج، يرجى التواصل معنا وطلب التفعيل المباشر.</p><Button asChild className="bg-[#25D366] hover:bg-[#25D366]/90 text-white font-black h-12 rounded-xl px-8 gap-2 shadow-lg"><a href={whatsappUrl} target="_blank"><MessageCircle className="w-5 h-5" />الاشتراك/تفعيل</a></Button></div></section>
          </TabsContent>
          <TabsContent value="curriculum" className="p-6 md:p-8"><CurriculumAccordion lessons={lessons || []} allCompletedIds={allCompletedIds} selectedLessonId={selectedLessonId} selectLesson={selectLesson} isLessonLocked={isLessonLocked} setIsFinishing={setIsFinishing} setSelectedLessonId={setSelectedLessonId} isAllLessonsCompleted={isAllLessonsCompleted} isFinishing={isFinishing} /></TabsContent>
          <TabsContent value="reviews" className="p-6 md:p-8 space-y-6">
            {courseReviews.map((review: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-primary/5 luxury-shadow space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.userPhoto || undefined} />
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
                        <AvatarFallback className="bg-secondary text-white text-[8px]">إدارة</AvatarFallback>
                      </Avatar>
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
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={isCurriculumOpen} onOpenChange={setIsCurriculumOpen}>
        <SheetContent side="right" className="w-[90%] sm:max-w-md p-0 overflow-y-auto" dir="rtl">
          <SheetHeader className="p-8 border-b text-right bg-muted/10"><SheetTitle className="text-2xl font-black">منهج الدورة</SheetTitle></SheetHeader>
          <div className="p-6"><CurriculumAccordion lessons={lessons || []} allCompletedIds={allCompletedIds} selectedLessonId={selectedLessonId} selectLesson={selectLesson} isLessonLocked={isLessonLocked} setIsFinishing={setIsFinishing} setSelectedLessonId={setSelectedLessonId} isAllLessonsCompleted={isAllLessonsCompleted} isFinishing={isFinishing} onClose={() => setIsCurriculumOpen(false)} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
