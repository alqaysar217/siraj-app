
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit2, 
  Trash2, 
  PlusCircle, 
  Loader2, 
  AlertTriangle, 
  X, 
  LayoutList, 
  LayoutGrid, 
  Users, 
  Star, 
  Clock, 
  BookOpen,
  Tags,
  BadgeDollarSign,
  Settings2,
  User,
  ShieldCheck,
  BarChart
} from "lucide-react";
import { useCollection } from "@/firebase";
import { collection, doc, deleteDoc, query, orderBy, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function ManageCoursesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [viewType, setViewType] = useState<"table" | "grid">("grid");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const coursesQuery = useMemoFirebase(() => 
    db ? query(collection(db, "courses"), orderBy("createdAt", "desc")) : null
  , [db]);

  const { data: courses, loading } = useCollection(coursesQuery);

  const handleDelete = async (course: any) => {
    if (!db) return;
    setIsDeleting(course.id);
    try {
      // نقل للسلة أولاً
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: course.id,
        originalPath: `courses/${course.id}`,
        type: "course",
        title: course.title,
        data: course,
        deletedAt: serverTimestamp()
      });

      // حذف حقيقي
      await deleteDoc(doc(db, "courses", course.id));
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحذف." });
    } finally {
      setIsDeleting(null);
    }
  };

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

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary">إدارة الدورات</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-muted p-1 rounded-xl border border-border/50">
              <Button 
                variant={viewType === "table" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewType("table")}
                className="rounded-lg h-9 w-9 p-0"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewType === "grid" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setViewType("grid")}
                className="rounded-lg h-9 w-9 p-0"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            
            <Button asChild className="bg-primary hover:bg-primary/90 gap-2 rounded-xl h-11 shadow-lg">
              <Link href="/admin/add-course">
                <PlusCircle className="w-5 h-5" /> إضافة دورة
              </Link>
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-50" />
          </div>
        ) : courses && courses.length > 0 ? (
          viewType === "table" ? (
            <Card className="luxury-shadow border border-primary/10 overflow-hidden bg-card/80 backdrop-blur-md rounded-3xl">
              <CardContent className="p-0">
                <Table className="text-right">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right font-bold py-5 px-6 border-l border-primary/5">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-secondary" />
                          <span>الدورة</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold py-5 border-l border-primary/5">
                        <div className="flex items-center justify-center gap-2">
                          <Tags className="w-4 h-4 text-secondary" />
                          <span>المجال</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold py-5 border-l border-primary/5">
                        <div className="flex items-center justify-center gap-2">
                          <BadgeDollarSign className="w-4 h-4 text-secondary" />
                          <span>السعر (ر.ي)</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold py-5 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <span>الإجراءات</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course: any) => (
                      <TableRow key={course.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                        <TableCell className="py-5 px-6 border-l border-primary/5">
                          <div className="flex items-center gap-4 text-right">
                            <div className="relative w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-primary/10">
                              {course.imageUrl ? (
                                <img src={course.imageUrl || undefined} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-muted-foreground/30" /></div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-primary text-sm leading-tight">{course.title}</div>
                              <div className="text-[10px] text-muted-foreground">{course.instructor}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center border-l border-primary/5">
                          <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20 px-2 py-0 text-[10px]">
                            {getCategoryName(course.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary border-l border-primary/5 text-sm">
                          {course.isFree ? "مجانية" : `${course.price}`}
                        </TableCell>
                        <TableCell className="text-center px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg border-primary/10">
                              <Link href={`/admin/add-course?id=${course.id}`}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-secondary/10 text-secondary">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
                                <div className="flex flex-col items-center text-center">
                                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-8 h-8 text-secondary" />
                                  </div>
                                  <AlertDialogHeader className="space-y-2 p-0">
                                    <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف الدورة؟</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground text-sm font-medium">
                                      سيتم نقل <span className="text-primary font-bold">"{course.title}"</span> إلى سلة المهملات.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                </div>
                                <AlertDialogFooter className="flex flex-row gap-3 mt-6">
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(course)}
                                    className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1"
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course: any) => (
                <Card key={course.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-[2rem] border border-primary/5 bg-card/80 backdrop-blur-sm">
                  <div className="relative aspect-video overflow-hidden">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl || undefined} 
                        alt={course.title}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                       <div className="w-full h-full bg-muted flex items-center justify-center"><BookOpen className="w-12 h-12 text-muted-foreground/20" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-secondary/90 text-white border-none px-3 py-1 rounded-xl shadow-lg font-bold text-[10px]">
                        {getLevelName(course.level)}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex-grow space-y-4 text-right">
                    <h3 className="text-lg font-bold text-primary line-clamp-1">{course.title}</h3>
                    
                    <p className="text-muted-foreground text-[11px] line-clamp-1 leading-relaxed opacity-80">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between border-y border-primary/5 py-3">
                       <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-secondary/20">
                            <AvatarImage src={course.instructorPhoto || undefined} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px]"><User className="w-4 h-4" /></AvatarFallback>
                          </Avatar>
                          <div className="text-right">
                             <div className="text-xs font-bold text-primary">{course.instructor}</div>
                             <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5 text-green-600" /> {course.instructorAccreditation || "مدرب معتمد"}
                             </div>
                          </div>
                       </div>
                       <Badge variant="secondary" className="bg-secondary/5 text-secondary border-none px-2 py-0 text-[10px] font-bold">
                          {getCategoryName(course.category)}
                       </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-secondary">{course.price} <small className="text-[10px]">ر.ي</small></span>
                          {course.oldPrice > 0 && (
                             <span className="text-[10px] text-muted-foreground line-through opacity-50">{course.oldPrice} ر.ي</span>
                          )}
                       </div>
                       <div className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-lg">
                          <Star className="w-3 h-3 text-secondary fill-secondary" />
                          <span className="text-xs font-bold text-primary">{course.rating || 5.0}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-muted/30 rounded-2xl p-3 border border-primary/5">
                       <div className="flex flex-col items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-secondary" />
                          <span className="text-[9px] font-bold text-primary">{course.durationHours || 0} ساعة</span>
                       </div>
                       <div className="flex flex-col items-center gap-1 border-x border-primary/10">
                          <BookOpen className="w-3.5 h-3.5 text-secondary" />
                          <span className="text-[9px] font-bold text-primary">{course.videosCount || 0} درس</span>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-secondary" />
                          <span className="text-[9px] font-bold text-primary">{course.studentsCount || 0} طالب</span>
                       </div>
                    </div>
                  </div>

                  <CardFooter className="p-5 pt-0 flex gap-2">
                    <Button asChild variant="outline" className="flex-1 rounded-2xl h-11 font-bold border-primary/10 hover:bg-primary/5 text-xs">
                      <Link href={`/admin/add-course?id=${course.id}`}>تعديل</Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-secondary/10 text-secondary hover:bg-secondary/5">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-secondary" />
                          </div>
                          <AlertDialogHeader className="space-y-2 p-0">
                            <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف الدورة؟</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground text-sm font-medium">سيتم نقل "{course.title}" إلى سلة المهملات.</AlertDialogDescription>
                          </AlertDialogHeader>
                        </div>
                        <AlertDialogFooter className="flex flex-row gap-3 mt-6">
                          <AlertDialogAction 
                            onClick={() => handleDelete(course)} 
                            className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1"
                          >
                            <Trash2 className="w-4 h-4" /> تأكيد
                          </AlertDialogAction>
                          <AlertDialogCancel className="h-11 rounded-xl border-primary/10 font-bold gap-2 flex-1 mt-0">
                            <X className="w-4 h-4" /> إلغاء
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="py-32 text-center bg-card/50 rounded-3xl border border-dashed border-primary/20 luxury-shadow">
            <BookOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary mb-6">لا توجد دورات حالياً</h3>
            <Button asChild className="h-12 px-8 rounded-2xl bg-primary text-white font-bold">
              <Link href="/admin/add-course">أضف دورتك الأولى</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
