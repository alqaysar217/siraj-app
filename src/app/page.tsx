'use client';

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Users, 
  ArrowLeft, 
  Sparkles, 
  MessageCircle, 
  Globe, 
  Terminal, 
  LineChart, 
  Wallet, 
  PieChart, 
  PenTool, 
  Shield, 
  CheckCircle2, 
  Mail, 
  Youtube, 
  Instagram, 
  Facebook, 
  Music2, 
  Phone, 
  Library, 
  Clock, 
  BookOpen, 
  User, 
  Tags, 
  ShieldCheck, 
  ChevronLeft, 
  FileText, 
  Linkedin,
  Twitter,
  Target,
  Rocket,
  PlayCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useMemo } from "react";

const DEFAULT_WHATSAPP = "+967735952927";

const SOCIAL_ICONS: Record<string, any> = {
  instagram: { icon: Instagram, color: "bg-pink-600" },
  youtube: { icon: Youtube, color: "bg-red-500" },
  facebook: { icon: Facebook, color: "bg-blue-600" },
  tiktok: { icon: Music2, color: "bg-black" },
  whatsapp: { icon: Phone, color: "bg-green-600" },
  twitter: { icon: Twitter, color: "bg-blue-400" },
  email: { icon: Mail, color: "bg-primary" },
  phone: { icon: Phone, color: "bg-secondary" }
};

export default function Home() {
  const db = useFirestore();
  const heroBg = "/hero.png";

  // استعلام لجلب كافة الدورات لاحتساب الأعداد في المجالات
  const allCoursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);
  const { data: allCourses } = useCollection(allCoursesQuery);

  const topCoursesQuery = useMemoFirebase(() => db ? query(collection(db, "courses"), orderBy("studentsCount", "desc"), limit(3)) : null, [db]);
  const { data: topCourses, loading: coursesLoading } = useCollection(topCoursesQuery);

  const topBooksQuery = useMemoFirebase(() => db ? query(collection(db, "books"), orderBy("createdAt", "desc"), limit(3)) : null, [db]);
  const { data: topBooks, loading: booksLoading } = useCollection(topBooksQuery);

  const topInstructorsQuery = useMemoFirebase(() => db ? query(collection(db, "instructors"), orderBy("rating", "desc"), limit(3)) : null, [db]);
  const { data: topInstructors, loading: instructorsLoading } = useCollection(topInstructorsQuery);

  const socialLinksQuery = useMemoFirebase(() => db ? query(collection(db, "socialLinks"), orderBy("order", "asc")) : null, [db]);
  const { data: socialLinks } = useCollection(socialLinksQuery);

  const whatsappLink = socialLinks?.find(l => l.platform === 'whatsapp')?.url || DEFAULT_WHATSAPP;

  // احتساب حقيقي لعدد الدورات لكل مجال
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCourses?.forEach((course: any) => {
      const cat = course.category || 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allCourses]);

  const categories = [
    { id: "networks", name: "الشبكات", icon: Globe },
    { id: "programming", name: "البرمجة", icon: Terminal },
    { id: "analysis", name: "تحليل البيانات", icon: LineChart },
    { id: "accounting", name: "المحاسبة", icon: Wallet },
    { id: "statistics", name: "الإحصاء", icon: PieChart },
    { id: "design", name: "التصميم", icon: PenTool },
    { id: "cybersecurity", name: "الأمن السيبراني", icon: Shield },
  ];

  const goals = [
    "تقديم تعليم احترافي بجودة عالية وتطبيقي.",
    "مساعدة الشباب على اكتساب مهارات مطلوبة في سوق العمل.",
    "توفير خدمات رقمية وتقنية باحترافية عالية.",
    "بناء مجتمع عربي يهتم بالتطوير والمعرفة.",
    "توفير شهادات موثوقة قابلة للتحقق إلكترونياً.",
    "ربط التعليم بالتطبيق العملي الحقيقي."
  ];

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
    return categoriesMap[slug] || slug;
  };

  const getLevelName = (level: string) => {
    const levels: Record<string, string> = {
      beginner: "مبتدئ",
      intermediate: "متوسط",
      advanced: "متقدم"
    };
    return levels[level] || level;
  };

  const getFormatName = (format: string) => {
    const formats: Record<string, string> = {
      paper: "ورقي",
      digital: "رقمي (PDF)",
      both: "ورقي + رقمي"
    };
    return formats[format] || format;
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      
      <section className="relative pt-16 md:pt-32 pb-24 px-4 overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroBg}
            alt="Hero Background" 
            fill 
            className="object-cover"
            priority
            data-ai-hint="technology education"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/80 to-background" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-right space-y-8 animate-in slide-in-from-right duration-700">
              <Badge variant="outline" className="px-4 py-1.5 rounded-full border-secondary/50 text-secondary bg-secondary/10 backdrop-blur-md font-black text-xs md:text-sm">
                <Sparkles className="w-4 h-4 ml-2" />
                المنصة التعليمية التقنية الأولى
              </Badge>
              <h1 className="text-3xl md:text-6xl lg:text-7xl font-black font-headline leading-tight text-white drop-shadow-lg">
                بناء مستقبل مهني <br />
                <span className="text-secondary">حقيقي بأسلوب عصري</span>
              </h1>
              <p className="text-white/80 text-base md:text-xl max-w-xl leading-relaxed font-medium">
                منصة سراج هي منصة تعليمية تقنية يمنية تهدف لتقديم تعليم بسيط يساعد الشباب العربي على التفوق في سوق العمل العالمي. اكتسب مهارات الغد مع خبراء الصناعة في بيئة تعليمية فاخرة وحديثة، من حضرموت إلى العالم.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="h-14 md:h-16 px-10 rounded-2xl text-lg font-black bg-secondary text-white shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-transform">
                  <Link href="/courses" className="gap-2">تصفح الكورسات <ArrowLeft className="w-5 h-5 rotate-180" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 md:h-16 px-10 rounded-2xl text-lg font-black border-white/20 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
                  <a href={`https://wa.me/${whatsappLink.replace(/\D/g, '')}?text=أهلاً سراج، أرغب في الحصول على استشارة بخصوص الكورسات.`} target="_blank" className="gap-2">
                    <MessageCircle className="w-5 h-5" /> تواصل مع المستشار
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative group animate-in zoom-in duration-1000 hidden lg:block">
              <div className="absolute -inset-4 bg-secondary/20 rounded-[3rem] blur-2xl group-hover:bg-secondary/30 transition-all" />
              <div className="relative aspect-video rounded-[3rem] overflow-hidden border-8 border-white/10 backdrop-blur-sm luxury-shadow rotate-2 group-hover:rotate-0 transition-transform duration-700">
                <img 
                  src="https://picsum.photos/seed/siraj_interface/800/600" 
                  alt="Siraj Learning Interface" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 -mt-10 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
             {categories.map((cat, i) => {
               const count = categoryCounts[cat.id] || 0;
               return (
                 <Card key={i} className="rounded-3xl border-none luxury-shadow hover:translate-y-[-8px] transition-all cursor-pointer group bg-white">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                          <cat.icon className="w-6 h-6" />
                       </div>
                       <h3 className="font-black text-primary text-xs md:text-sm">{cat.name}</h3>
                       <span className="text-[10px] text-muted-foreground font-bold">{count} دورة</span>
                    </CardContent>
                 </Card>
               );
             })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 text-right">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-4xl font-black font-headline text-primary">الدورات الأكثر إقبالاً</h2>
              <p className="text-muted-foreground font-bold text-xs md:text-base">انضم لمئات الطلاب الذين بدأوا رحلة تغيير مستقبلهم</p>
            </div>
            <Button variant="link" asChild className="text-secondary font-black gap-2 p-0 h-auto self-start md:self-center">
              <Link href="/courses">كل الدورات <ArrowLeft className="w-4 h-4 rotate-180" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {coursesLoading ? (
              [1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />)
            ) : topCourses?.map((course: any) => (
              <Card key={course.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-[1.5rem] border border-primary/5 bg-card transition-all hover:translate-y-[-4px]">
                <div className="relative aspect-video overflow-hidden">
                  <Image 
                    src={course.imageUrl || "https://picsum.photos/seed/course/600/400"} 
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-secondary/90 text-white border-none px-2 py-0.5 rounded-lg shadow-lg font-bold text-[9px]">
                      {getLevelName(course.level)}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 flex-grow space-y-3 text-right">
                  <h3 className="text-base font-bold text-primary line-clamp-1 group-hover:text-secondary transition-colors">{course.title}</h3>
                  
                  <div className="flex items-center justify-between border-y border-primary/5 py-2">
                     <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border border-secondary/20">
                          <AvatarImage src={course.instructorPhoto || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/5 text-primary text-[8px]"><User className="w-3 h-3" /></AvatarFallback>
                        </Avatar>
                        <div className="text-right">
                           <div className="text-[10px] font-bold text-primary">{course.instructor}</div>
                        </div>
                     </div>
                     <Badge variant="secondary" className="bg-secondary/5 text-secondary border-none px-2 py-0 text-[9px] font-bold">
                        {getCategoryName(course.category)}
                     </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-secondary">{course.price} <small className="text-[8px]">ر.ي</small></span>
                        {course.oldPrice > 0 && (
                          <span className="text-[10px] text-muted-foreground line-through opacity-50">{course.oldPrice} ر.ي</span>
                        )}
                     </div>
                     <div className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-lg">
                        <Star className="w-2.5 h-2.5 text-secondary fill-secondary" />
                        <span className="text-[10px] font-bold text-primary">{course.rating || 5.0}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-muted/30 rounded-xl p-2 border border-primary/5">
                     <div className="flex flex-col items-center gap-0.5">
                        <Clock className="w-3 h-3 text-secondary" />
                        <span className="text-[7px] md:text-[8px] font-bold text-primary whitespace-nowrap">{course.durationHours || 0} ساعة</span>
                     </div>
                     <div className="flex flex-col items-center gap-0.5 border-x border-primary/10 px-0.5">
                        <BookOpen className="w-3 h-3 text-secondary" />
                        <span className="text-[7px] md:text-[8px] font-bold text-primary whitespace-nowrap">{course.videosCount || 0} درس</span>
                     </div>
                     <div className="flex flex-col items-center gap-0.5">
                        <Users className="w-3 h-3 text-secondary" />
                        <span className="text-[7px] md:text-[8px] font-bold text-primary whitespace-nowrap">{course.studentsCount || 0} طالب</span>
                     </div>
                  </div>
                </div>

                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full rounded-xl h-10 bg-primary text-white hover:bg-primary/90 shadow-sm font-bold text-xs">
                    <Link href={`/course/${course.id}`}>تفاصيل الكورس</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 text-right">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-4xl font-black font-headline text-primary">المكتبة العلمية</h2>
              <p className="text-muted-foreground font-bold text-xs md:text-base">مراجع تقنية معتمدة من أفضل المتخصصين</p>
            </div>
            <Button variant="link" asChild className="text-secondary font-black gap-2 p-0 h-auto self-start md:self-center">
              <Link href="/books">كل الكتب <ArrowLeft className="w-4 h-4 rotate-180" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {booksLoading ? (
              [1,2,3].map(i => <div key={i} className="h-80 rounded-3xl bg-muted animate-pulse" />)
            ) : topBooks?.map((book: any) => (
              <Card key={book.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-2xl border border-primary/5 bg-card transition-all hover:translate-y-[-4px]">
                <div className="relative aspect-[3/4] overflow-hidden max-h-[220px] md:max-h-none">
                  <Image 
                    src={book.imageUrl || "https://picsum.photos/seed/book/600/800"} 
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-secondary/90 text-white border-none px-2 py-0.5 rounded-lg shadow-lg font-bold text-[8px]">
                      {getFormatName(book.format)}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 flex-grow space-y-3 text-right">
                  <h3 className="text-sm md:text-base font-black text-primary line-clamp-1 leading-tight group-hover:text-secondary transition-colors">
                    {book.title}
                  </h3>
                  
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="w-3 h-3 text-secondary" />
                      <span>{book.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground border-r pr-3 border-primary/5">
                      <Tags className="w-3 h-3 text-secondary" />
                      <span>{getCategoryName(book.category)}</span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-2.5 space-y-2 border border-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-secondary fill-secondary" />
                          <span className="text-[9px] font-black text-primary">{book.rating || 5.0}</span>
                        </div>
                        <div className="flex items-center gap-0.5 border-r pr-2 border-primary/10">
                          <FileText className="w-2.5 h-2.5 text-secondary" />
                          <span className="text-[9px] font-black text-primary">{book.pages} ص</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] md:text-sm font-black text-secondary">{book.price} <small className="text-[7px]">ر.ي</small></span>
                        {book.oldPrice > 0 && (
                          <span className="text-[8px] text-muted-foreground line-through opacity-50">{book.oldPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <CardFooter className="p-4 pt-0">
                  <Button asChild className="w-full rounded-xl h-9 bg-primary text-white hover:bg-primary/90 shadow-sm font-bold text-[10px] gap-2">
                    <Link href={`/book/${book.id}`}>تفاصيل الكتاب <ArrowLeft className="w-3.5 h-3.5 rotate-180" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-3">
             <h2 className="text-2xl md:text-4xl font-black text-primary font-headline">نخبة مدربي سراج</h2>
             <p className="text-muted-foreground font-bold text-xs md:text-base">تعلم من خبراء الصناعة أصحاب الخبرة العملية</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {topInstructors?.map((instructor: any) => (
              <Card key={instructor.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-[2.5rem] border border-primary/5 bg-card transition-all hover:translate-y-[-8px]">
                <div className="relative aspect-square overflow-hidden max-h-56">
                  <img 
                    src={instructor.photoURL || `https://picsum.photos/seed/${instructor.id}/400/400`} 
                    alt={instructor.name} 
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-4 right-4">
                     <Badge className="bg-secondary/90 text-white border-none px-4 py-1 rounded-xl font-black text-[10px] shadow-lg">
                        {getCategoryName(instructor.specialty)}
                     </Badge>
                  </div>
                </div>

                <div className="p-6 flex-grow space-y-6 text-right">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h3 className="text-xl font-black text-primary font-headline leading-none">{instructor.name}</h3>
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
                           <ShieldCheck className="w-3.5 h-3.5" />
                           <span>{instructor.accreditation || "مدرب معتمد"}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/5">
                        <Star className="w-4 h-4 text-secondary fill-secondary" />
                        <span className="text-xs font-black text-primary">{instructor.rating || "5.0"}</span>
                     </div>
                  </div>
                  
                  <p className="text-muted-foreground text-xs font-medium line-clamp-1 leading-relaxed text-center px-4 italic opacity-90">
                    "{instructor.bio}"
                  </p>

                  <div className="flex items-center justify-center gap-4 py-2">
                    {instructor.socials?.linkedin && (
                      <a href={instructor.socials.linkedin} target="_blank" className="text-[#0077B5] hover:scale-125 transition-transform"><Linkedin className="w-5 h-5" /></a>
                    )}
                    {instructor.socials?.instagram && (
                      <a href={instructor.socials.instagram} target="_blank" className="text-[#E4405F] hover:scale-125 transition-transform"><Instagram className="w-5 h-5" /></a>
                    )}
                    {instructor.socials?.facebook && (
                      <a href={instructor.socials.facebook} target="_blank" className="text-[#1877F2] hover:scale-125 transition-transform"><Facebook className="w-5 h-5" /></a>
                    )}
                    {instructor.socials?.whatsapp && (
                      <a href={`https://wa.me/${instructor.socials.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-[#25D366] hover:scale-125 transition-transform"><MessageCircle className="w-5 h-5" /></a>
                    )}
                  </div>

                  <Button asChild className="w-full h-11 rounded-2xl bg-primary text-white font-black text-xs gap-2 shadow-lg shadow-primary/10 transition-transform active:scale-95">
                    <Link href={`/instructor/${instructor.id}`}>
                      عرض الملف الكامل <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild className="bg-primary text-white h-14 px-12 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
               <Link href="/instructors">تعرف على كافة المدربين</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 blur-[150px] -z-0" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
             <div className="space-y-12 text-right">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-black font-headline">منصة سراج التعليمية</h2>
                  <p className="text-lg md:text-xl opacity-80 leading-relaxed font-medium">
                    منصة تعليمية وخدمية عربية احترافية تجمع بين التعليم الحديث، والخدمات الرقمية، والتطوير المهني في مكان واحد، بهدف تمكين الشباب العربي من اكتساب المهارات الحقيقية وبناء مستقبلهم بثقة.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-lg"><Target className="w-8 h-8" /></div>
                    <h4 className="text-2xl font-black font-headline">رؤيتنا</h4>
                    <p className="text-sm opacity-70 leading-loose">أن تصبح سراج واحدة من أبرز المنصات التعليمية والخدمية في العالم العربي، عبر تقديم تعليم عصري يساعد الشباب على دخول سوق العمل بمهارة واحترافية.</p>
                  </div>
                  <div className="p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-lg"><Rocket className="w-8 h-8" /></div>
                    <h4 className="text-2xl font-black font-headline">رسالتنا</h4>
                    <p className="text-sm opacity-70 leading-loose">توفير بيئة تعليمية تجمع بين المعرفة والتطبيق العملي، تمنح المستخدمين تجربة احترافية بأسلوب بسيط وجودة عالية وأسعار مناسبة.</p>
                  </div>
                </div>
             </div>

             <div className="space-y-8 bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10">
                <h3 className="text-3xl font-black font-headline text-secondary">أهدافنا الرئيسية</h3>
                <div className="grid gap-4">
                  {goals.map((goal, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                       <CheckCircle2 className="w-6 h-6 text-secondary" />
                       <span className="text-sm md:text-lg font-black">{goal}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      <footer className="py-20 bg-muted/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
             <div className="text-right space-y-6">
                <h3 className="text-3xl font-black text-primary font-headline">تواصل معنا</h3>
                <p className="text-muted-foreground font-bold">هل أنت مستثمر؟ أو تود عقد شراكة تعليمية؟ يسعدنا دائماً سماع صوتك.</p>
                <div className="space-y-3">
                  {socialLinks?.find(l => l.platform === 'email') && (
                    <a href={`mailto:${socialLinks.find(l => l.platform === 'email')?.url}`} className="flex items-center gap-3 text-primary font-black hover:text-secondary transition-colors">
                      <div className="p-2 bg-primary/5 rounded-xl"><Mail className="w-5 h-5" /></div>
                      {socialLinks.find(l => l.platform === 'email')?.url}
                    </a>
                  )}
                  {socialLinks?.find(l => l.platform === 'phone') && (
                    <div className="flex items-center gap-3 text-primary font-black">
                      <div className="p-2 bg-primary/5 rounded-xl"><Phone className="w-5 h-5" /></div>
                      {socialLinks.find(l => l.platform === 'phone')?.url}
                    </div>
                  )}
                </div>
             </div>

             <div className="text-right space-y-6">
                <h3 className="text-3xl font-black text-primary font-headline">تابعنا على المنصات</h3>
                <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4">
                  {socialLinks?.map((link: any) => {
                    const social = SOCIAL_ICONS[link.platform] || { icon: Globe, color: "bg-primary" };
                    const Icon = social.icon;
                    return (
                      <a 
                        key={link.id} 
                        href={link.url.startsWith('http') ? link.url : (link.platform === 'email' ? `mailto:${link.url}` : link.platform === 'phone' ? `tel:${link.url}` : `https://${link.url}`)} 
                        target="_blank"
                        className={cn("h-11 md:h-14 px-3 md:px-6 rounded-xl md:rounded-2xl flex items-center justify-center md:justify-start gap-2 md:gap-3 text-white font-black shadow-lg transition-transform hover:-translate-y-1", social.color)}
                      >
                         <Icon className="w-4 h-4 md:w-5 md:h-5" />
                         <span className="text-[10px] md:text-xs truncate">{link.label}</span>
                      </a>
                    );
                  })}
                </div>
             </div>
          </div>
          <Separator className="bg-primary/10" />
          <div className="mt-12 text-center text-muted-foreground font-black text-sm">
            جميع الحقوق محفوظة لمنصة سراج التعليمية © {new Date().getFullYear()} - تم التطوير برؤية عصرية
          </div>
        </div>
      </footer>
    </div>
  );
}
