"use client";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Trophy, 
  Loader2, 
  Search, 
  ArrowRight,
  User,
  Tags,
  Clock
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/firebase/auth/use-user";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, where, documentId } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
  const { user, profile, loading: userLoading } = useUser();
  const db = useFirestore();

  const enrolledCourseIds = profile?.enrolledCourses || [];
  
  // نستخدم التصفية النصية للمصفوفة كاعتمادية لضمان استقرار المرجع ومنع التحديث المتكرر
  const enrolledIdsKey = enrolledCourseIds.join(',');

  const coursesQuery = useMemoFirebase(() => {
    if (!db || enrolledCourseIds.length === 0) return null;
    return query(collection(db, "courses"), where(documentId(), "in", enrolledCourseIds));
  }, [db, enrolledIdsKey]);

  const { data: enrolledCourses, loading: coursesLoading } = useCollection(coursesQuery);

  // دالة تحويل المجال للعربية
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

  // حساب إحصائيات الطالب الحقيقية
  const stats = {
    enrolledCount: enrolledCourseIds.length,
    completedCount: enrolledCourses?.filter(course => {
      const progress = profile?.progress?.[course.id]?.completedLessons || [];
      return progress.length > 0 && progress.length >= (course.videosCount || 1);
    }).length || 0,
    totalPoints: Object.values(profile?.progress || {}).reduce((acc: number, curr: any) => acc + (curr.points || 0), 0)
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background text-right" dir="rtl">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold font-headline text-primary">
            مرحباً بك، {profile?.name || "طالب سراج"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">تابع تقدمك الدراسي واستثمر في مهاراتك</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-12">
          <Card className="luxury-shadow border-primary/5 hover:border-secondary/20 transition-all bg-card/50 backdrop-blur-sm group">
            <CardContent className="p-5 md:p-6 flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="flex-1">
                <div className="text-2xl md:text-3xl font-black text-primary leading-none">{stats.enrolledCount}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-bold mt-1 uppercase tracking-wider">دورات مسجلة</div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-primary/5 hover:border-secondary/20 transition-all bg-card/50 backdrop-blur-sm group">
            <CardContent className="p-5 md:p-6 flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="flex-1">
                <div className="text-2xl md:text-3xl font-black text-primary leading-none">{stats.completedCount}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-bold mt-1 uppercase tracking-wider">دورات مكتملة</div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-primary/5 hover:border-secondary/20 transition-all bg-card/50 backdrop-blur-sm group">
            <CardContent className="p-5 md:p-6 flex items-center gap-4 flex-row-reverse">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shrink-0 group-hover:bg-secondary group-hover:text-white transition-colors">
                <Trophy className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="flex-1">
                <div className="text-2xl md:text-3xl font-black text-primary leading-none">{stats.totalPoints}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-bold mt-1 uppercase tracking-wider">نقاط المنصة</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between flex-row-reverse mb-8">
            <h2 className="text-xl md:text-3xl font-black font-headline text-primary">مكتبة دوراتي</h2>
            <Button variant="link" asChild className="text-secondary font-black hover:no-underline p-0 h-auto text-sm gap-2">
              <Link href="/courses" className="flex items-center gap-1">استكشف المزيد من الدورات <ArrowRight className="w-4 h-4 rotate-180" /></Link>
            </Button>
          </div>

          {coursesLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-secondary opacity-50" />
            </div>
          ) : enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {enrolledCourses.map((course: any) => {
                const courseProgress = profile?.progress?.[course.id] || { completedLessons: [] };
                const completedCount = courseProgress.completedLessons?.length || 0;
                const totalCount = course.videosCount || 1;
                const progressPercentage = Math.round((completedCount / totalCount) * 100);
                const isFinished = progressPercentage >= 100;

                return (
                  <Card key={course.id} className="overflow-hidden luxury-shadow flex flex-col md:flex-row-reverse border-primary/5 hover:border-secondary/20 transition-all group rounded-[2rem] bg-white">
                    <div className="relative w-full md:w-48 lg:w-64 h-44 md:h-auto shrink-0 overflow-hidden">
                      <Image 
                        src={course.imageUrl || "https://picsum.photos/seed/course/600/400"} 
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {isFinished && (
                        <div className="absolute inset-0 bg-green-600/40 backdrop-blur-[2px] flex items-center justify-center">
                           <div className="bg-white p-3 rounded-full shadow-2xl scale-110 animate-in zoom-in duration-500">
                              <CheckCircle2 className="w-8 h-8 text-green-600" />
                           </div>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 md:hidden">
                        <Badge className="bg-primary/80 backdrop-blur-md text-white border-none font-bold">
                           {getCategoryName(course.category)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col justify-between flex-1 text-right">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-row-reverse">
                          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none px-3 py-1 font-black text-[10px] hidden md:inline-flex">
                            {getCategoryName(course.category)}
                          </Badge>
                          <div className="flex items-center gap-2 text-muted-foreground">
                             <User className="w-3.5 h-3.5 text-secondary" />
                             <span className="text-[10px] font-bold">{course.instructor}</span>
                          </div>
                        </div>

                        <h3 className="text-xl md:text-2xl font-black text-primary line-clamp-1 leading-tight group-hover:text-secondary transition-colors">
                          {course.title}
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between flex-row-reverse text-[10px] font-black">
                            <span className="text-muted-foreground uppercase tracking-wider">نسبة الإنجاز</span>
                            <span className={cn(isFinished ? "text-green-600" : "text-secondary")}>{progressPercentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all duration-1000 ease-out", isFinished ? "bg-green-600" : "bg-secondary")}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-primary/5">
                        <div className="flex items-center gap-4 text-muted-foreground">
                           <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-1.5 rounded-xl">
                              <Play className="w-3 h-3 text-secondary" />
                              <span className="text-[10px] font-black text-primary">{completedCount} / {totalCount} درس</span>
                           </div>
                        </div>
                        <Button asChild className={cn(
                          "w-full sm:w-auto h-11 px-8 rounded-xl font-black text-sm gap-2 shadow-lg transition-transform active:scale-95",
                          isFinished ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
                        )}>
                          <Link href={`/course/${course.id}`}>
                            {isFinished ? "مراجعة المحتوى" : "استكمال التعلم"}
                            <ArrowRight className="w-4 h-4 rotate-180" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 md:py-32 bg-card/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-primary/20 luxury-shadow max-w-3xl mx-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">لا توجد دورات مسجلة بعد</h3>
              <p className="text-muted-foreground text-sm md:text-lg max-w-sm mx-auto leading-relaxed">
                ابدأ رحلتك التعليمية اليوم باختيار إحدى الدورات المميزة من مكتبتنا.
              </p>
              <Button asChild className="bg-secondary text-white mt-8 rounded-2xl h-12 md:h-14 px-8 md:px-12 font-bold hover:bg-secondary/90 shadow-lg shadow-secondary/20 transition-all">
                <Link href="/courses">استكشاف الدورات الآن</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
