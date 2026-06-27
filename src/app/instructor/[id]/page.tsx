
"use client";

import { use, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Briefcase,
  Loader2,
  GraduationCap,
  Trophy,
  BookOpen,
  ArrowRight,
  MessageSquareQuote,
  CheckCircle2,
  ChevronLeft,
  PlayCircle
} from "lucide-react";
import { useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function InstructorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();

  const instructorRef = useMemoFirebase(() => db ? doc(db, "instructors", id) : null, [db, id]);
  const { data: instructor, loading: instructorLoading } = useDoc(instructorRef);

  const coursesQuery = useMemoFirebase(() => 
    db ? query(collection(db, "courses"), where("instructorId", "==", id)) : null
  , [db, id]);
  const { data: courses, loading: coursesLoading } = useCollection(coursesQuery);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !courses || courses.length === 0) return null;
    const courseIds = courses.map((c: any) => c.id).filter(Boolean);
    if (courseIds.length === 0) return null;
    return query(collection(db, "reviews"), where("courseId", "in", courseIds));
  }, [db, courses]);
  
  const { data: reviews } = useCollection(reviewsQuery);

  const getCategoryName = (slug: string) => {
    const categories: Record<string, string> = {
      programming: "البرمجة والتطوير",
      web: "تطوير الويب",
      design: "التصميم الإبداعي",
      ai: "الذكاء الاصطناعي",
      cybersecurity: "الأمن السيبراني",
      management: "الإدارة والقيادة",
    };
    return categories[slug] || slug;
  };

  if (instructorLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <User className="w-20 h-20 text-muted-foreground/30 mb-6" />
          <h1 className="text-2xl font-bold text-primary">عذراً، هذا المدرب غير موجود</h1>
          <Button asChild className="mt-6 bg-primary text-white rounded-xl h-12 px-8">
            <Link href="/instructors">العودة لقائمة المدربين</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      
      <div className="bg-primary text-white py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[100px] -z-0" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
            <div className="relative group">
              <div className="absolute inset-0 bg-secondary rounded-[2.5rem] rotate-6 scale-95 opacity-20 group-hover:rotate-0 transition-transform duration-500" />
              <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] overflow-hidden border-8 border-white/10 luxury-shadow">
                <img src={instructor.photoURL || undefined} alt={instructor.name} className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Badge className="bg-secondary text-white border-none px-4 py-1 rounded-full font-black text-xs">
                  {getCategoryName(instructor.specialty)}
                </Badge>
                <h1 className="text-3xl md:text-6xl font-black font-headline leading-tight">{instructor.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 text-green-400 font-black">
                  <ShieldCheck className="w-5 h-5" />
                  <span>{instructor.accreditation || "مدرب معتمد"}</span>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4">
                 <div className="flex items-center gap-1 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                    <Star className="w-5 h-5 text-secondary fill-secondary" />
                    <span className="text-lg font-black">{instructor.rating || "5.0"}</span>
                 </div>
                 <div className="flex items-center gap-4 text-white/80">
                    {instructor.socials?.linkedin && <a href={instructor.socials.linkedin} target="_blank" className="hover:text-secondary transition-colors"><Linkedin className="w-6 h-6" /></a>}
                    {instructor.socials?.instagram && <a href={instructor.socials.instagram} target="_blank" className="hover:text-secondary transition-colors"><Instagram className="w-6 h-6" /></a>}
                    {instructor.socials?.facebook && <a href={instructor.socials.facebook} target="_blank" className="hover:text-secondary transition-colors"><Facebook className="w-6 h-6" /></a>}
                    {instructor.socials?.whatsapp && <a href={`https://wa.me/${instructor.socials.whatsapp.replace(/\D/g, '')}`} target="_blank" className="hover:text-secondary transition-colors"><MessageCircle className="w-6 h-6" /></a>}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 md:-mt-12 max-w-5xl space-y-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8 md:space-y-10">
            <Card className="rounded-[2.5rem] border-none luxury-shadow p-6 md:p-12 bg-white space-y-10">
               <section className="space-y-4 text-right">
                  <h3 className="text-xl md:text-2xl font-black text-primary font-headline flex items-center gap-3">
                    <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary"><User className="w-6 h-6" /></div>
                    نبذة عن المدرب
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium whitespace-pre-line px-1">
                    {instructor.bio}
                  </p>
               </section>

               {instructor.qualifications && (
                 <section className="space-y-5 text-right pt-8 border-t border-primary/5">
                    <h3 className="text-xl md:text-2xl font-black text-primary font-headline flex items-center gap-3">
                      <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary"><Trophy className="w-6 h-6" /></div>
                      المؤهلات والخبرات
                    </h3>
                    <div className="bg-primary/5 p-6 md:p-8 rounded-[2rem] border border-primary/5 italic font-bold text-primary/80 leading-[1.8] whitespace-pre-line shadow-inner">
                       {instructor.qualifications}
                    </div>
                 </section>
               )}
            </Card>

            {reviews && reviews.length > 0 && (
              <section className="space-y-6">
                <h3 className="text-2xl font-black text-primary font-headline flex items-center gap-3 px-4">
                  <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary"><MessageSquareQuote className="w-6 h-6" /></div>
                  قالوا عن المدرب
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review: any, i: number) => (
                    <Card key={i} className="rounded-3xl border-none luxury-shadow p-6 bg-white/80 backdrop-blur-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/10 shadow-sm">
                           <AvatarImage src={review.userPhoto || undefined} className="object-cover" />
                           <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">{review.userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-right">
                           <div className="text-xs font-black text-primary">{review.userName}</div>
                           <div className="flex items-center gap-0.5 mt-0.5">
                              {[...Array(5)].map((_, s) => (
                                <Star key={s} className={cn("w-2.5 h-2.5", s < review.rating ? "text-secondary fill-secondary" : "text-muted")} />
                              ))}
                           </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-bold italic line-clamp-3">"{review.comment}"</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
             <div className="sticky top-24 space-y-6">
                <h3 className="text-xl font-black text-primary font-headline flex items-center gap-2 pr-2">
                  <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-secondary"><BookOpen className="w-5 h-5" /></div>
                  دورات المدرب ({courses?.length || 0})
                </h3>
                
                {coursesLoading ? (
                  <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-secondary" /></div>
                ) : courses && courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map((course: any) => (
                      <Link key={course.id} href={`/course/${course.id}`}>
                        <Card className="rounded-2xl border-none luxury-shadow overflow-hidden group hover:scale-[1.02] transition-transform bg-white">
                          <div className="relative aspect-video">
                             <img src={course.imageUrl || undefined} alt={course.title} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircle className="text-white w-10 h-10" />
                             </div>
                          </div>
                          <CardContent className="p-4 text-right">
                             <h4 className="text-sm font-black text-primary line-clamp-1 group-hover:text-secondary transition-colors">{course.title}</h4>
                             <div className="flex items-center justify-between mt-3">
                                <span className="text-[10px] font-black text-secondary">{course.price} ر.ي</span>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                                   <GraduationCap className="w-3 h-3" />
                                   <span>{course.studentsCount} طالب</span>
                                </div>
                             </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-primary/5">
                    <p className="text-xs text-muted-foreground font-black">لا توجد دورات متاحة حالياً.</p>
                  </div>
                )}

                <Button asChild variant="outline" className="w-full h-14 rounded-2xl border-primary/10 gap-2 font-black text-primary shadow-sm hover:bg-primary/5 mt-4">
                  <Link href="/instructors">
                     <ArrowRight className="w-5 h-5" /> العودة لكافة المدربين
                  </Link>
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
