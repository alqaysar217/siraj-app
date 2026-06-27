"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  SlidersHorizontal, 
  Loader2, 
  X,
  User,
  ShieldCheck,
  Award,
  BadgeDollarSign
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [level, setLevel] = useState("all");
  const [certificate, setCertificate] = useState("all");

  const db = useFirestore();
  const coursesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "courses"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: coursesFromDb, loading } = useCollection(coursesQuery);

  const getCategoryName = (slug: string) => {
    const categories: Record<string, string> = {
      programming: "البرمجة",
      web: "الويب",
      games: "الألعاب",
      networks: "الشبكات",
      os: "نظم التشغيل",
      databases: "قواعد البيانات",
      ai: "الذكاء الاصطناعي",
      cybersecurity: "الأمن السيبراني",
      encryption: "التشفير",
      design: "التصميم",
      management: "الإدارة",
      accounting: "المحاسبة",
      economics: "الاقتصاد",
      analysis: "التحليل",
      math: "الرياضيات",
      statistics: "الإحصاء",
      quantitative: "الأساليب الكمية"
    };
    return categories[slug] || slug;
  };

  const getLevelName = (level: string) => {
    const levels: Record<string, string> = {
      beginner: "مبتدئ",
      intermediate: "متوسط",
      advanced: "متقدم"
    };
    return levels[level] || level;
  };

  const filteredCourses = useMemo(() => {
    if (!coursesFromDb) return [];
    return coursesFromDb.filter((course: any) => {
      const matchesSearch = (course.title || "").toLowerCase().includes(search.toLowerCase()) || 
                           (course.instructor || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || course.category === category;
      const matchesLevel = level === "all" || course.level === level;
      const matchesPrice = priceRange === "all" 
        || (priceRange === "free" && (course.isFree || course.price === 0))
        || (priceRange === "paid" && (!course.isFree && course.price > 0));
      const matchesCert = certificate === "all"
        || (certificate === "yes" && course.hasCertificate)
        || (certificate === "no" && !course.hasCertificate);
      
      return matchesSearch && matchesCategory && matchesLevel && matchesPrice && matchesCert;
    });
  }, [coursesFromDb, search, category, priceRange, level, certificate]);

  const resetFilters = () => {
    setCategory("all");
    setPriceRange("all");
    setLevel("all");
    setCertificate("all");
    setSearch("");
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10 space-y-6">
          <div className="text-right">
            <h1 className="text-2xl md:text-4xl font-black font-headline text-primary">استكشف الدورات المتاحة</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input 
                placeholder="ابحث عن دورة..." 
                className="h-12 md:h-14 pr-10 text-right rounded-xl border-primary/10 luxury-shadow bg-card" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 md:h-14 px-4 rounded-xl border-primary/10 luxury-shadow bg-card gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-secondary" />
                  <span className="hidden sm:inline font-bold">تصفية</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 overflow-y-auto" dir="rtl">
                <SheetHeader className="p-8 text-right border-b bg-muted/10 relative">
                   <SheetClose asChild className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
                        <div className="p-2 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all cursor-pointer">
                          <X className="w-5 h-5 text-primary" />
                        </div>
                   </SheetClose>
                  <SheetTitle className="text-xl font-headline text-primary flex items-center justify-start gap-2">
                    <Filter className="w-5 h-5 text-secondary" />
                    تصفية البحث
                  </SheetTitle>
                </SheetHeader>
                
                <div className="p-8 space-y-6 text-right">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3 h-3" /> المجال التعليمي
                    </label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger dir="rtl" className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">كل المجالات</SelectItem>
                        <SelectItem value="programming">البرمجة</SelectItem>
                        <SelectItem value="web">الويب</SelectItem>
                        <SelectItem value="games">الألعاب</SelectItem>
                        <SelectItem value="networks">الشبكات</SelectItem>
                        <SelectItem value="os">نظم التشغيل</SelectItem>
                        <SelectItem value="databases">قواعد البيانات</SelectItem>
                        <SelectItem value="ai">الذكاء الاصطناعي</SelectItem>
                        <SelectItem value="cybersecurity">الأمن السيبراني</SelectItem>
                        <SelectItem value="encryption">التشفير</SelectItem>
                        <SelectItem value="design">التصميم</SelectItem>
                        <SelectItem value="management">الإدارة</SelectItem>
                        <SelectItem value="accounting">المحاسبة</SelectItem>
                        <SelectItem value="economics">الاقتصاد</SelectItem>
                        <SelectItem value="analysis">التحليل</SelectItem>
                        <SelectItem value="math">الرياضيات</SelectItem>
                        <SelectItem value="statistics">الإحصاء</SelectItem>
                        <SelectItem value="quantitative">الأساليب الكمية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <ShieldCheck className="w-3 h-3" /> مستوى الدورة
                    </label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger dir="rtl" className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">كل المستويات</SelectItem>
                        <SelectItem value="beginner">مبتدئ</SelectItem>
                        <SelectItem value="intermediate">متوسط</SelectItem>
                        <SelectItem value="advanced">متقدم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <BadgeDollarSign className="w-3 h-3" /> نوع الاستثمار
                    </label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger dir="rtl" className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="free">دورات مجانية</SelectItem>
                        <SelectItem value="paid">دورات مدفوعة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Award className="w-3 h-3" /> شهادة إتمام
                    </label>
                    <Select value={certificate} onValueChange={setCertificate}>
                      <SelectTrigger dir="rtl" className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="yes">يوجد شهادة</SelectItem>
                        <SelectItem value="no">بدون شهادة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={resetFilters} variant="ghost" className="w-full text-destructive font-bold text-xs mt-6">
                    إعادة ضبط كافة الفلاتر
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-12 h-12 animate-spin text-secondary" /></div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course: any) => (
              <Card key={course.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-[1.5rem] border border-primary/5 bg-card/80 backdrop-blur-sm transition-all hover:translate-y-[-4px]">
                <div className="relative aspect-video overflow-hidden">
                  <Image 
                    src={course.imageUrl || "https://picsum.photos/seed/course/600/400"} 
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
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
                          <AvatarImage src={course.instructorPhoto} className="object-cover" />
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
                    <Link href={`/course/${course.id}`}>تفاصيل الدورة</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card rounded-3xl border border-dashed border-border/50">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-primary mb-3">لا توجد نتائج</h3>
            <Button variant="link" onClick={resetFilters} className="text-secondary font-bold">عرض الكل</Button>
          </div>
        )}
      </div>
    </div>
  );
}
