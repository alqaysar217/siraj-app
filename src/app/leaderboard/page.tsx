
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, 
  Loader2, 
  Award, 
  Medal,
  Crown,
  ChevronDown,
  UserPlus,
  Lock,
  LogIn
} from "lucide-react";
import { useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

export default function LeaderboardPage() {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // الاستعلام يطلب فقط الطلاب الذين وافقوا على الظهور
  const usersQuery = useMemoFirebase(() => 
    (db && user) ? query(
      collection(db, "users"), 
      where("showInLeaderboard", "==", true),
      limit(100) 
    ) : null
  , [db, user]);
  
  const { data: users, loading: dataLoading } = useCollection(usersQuery);

  const leaderboard = useMemo(() => {
    if (!users) return [];

    return users.map((u: any) => {
      const progressEntries = Object.values(u.progress || {});
      const totalPoints = progressEntries.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0);
      
      return {
        id: u.id,
        name: u.name,
        photoURL: u.photoURL,
        totalPoints
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [users]);

  const visibleLeaderboard = useMemo(() => {
    return leaderboard.slice(0, visibleCount);
  }, [leaderboard, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  // حالة التحميل
  if (authLoading || (user && dataLoading && visibleLeaderboard.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-secondary opacity-50" />
          <p className="mt-4 text-muted-foreground font-bold">جاري تحميل قائمة الأبطال...</p>
        </div>
      </div>
    );
  }

  // حالة الزائر غير المسجل
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-20 max-w-2xl text-center flex flex-col items-center justify-center">
           <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 border-2 border-dashed border-primary/10">
              <Lock className="w-12 h-12 text-primary opacity-40" />
           </div>
           <h1 className="text-3xl md:text-4xl font-black text-primary font-headline mb-4">محتوى حصري للمشتركين</h1>
           <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              لوحة المتصدرين وقائمة الشرف متاحة فقط لطلاب "سراج" المسجلين. سجل دخولك الآن لتكتشف ترتيبك وتنافس مع زملائك.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-primary text-white font-black text-xl shadow-xl">
                 <Link href="/auth/login" className="gap-2">
                    <LogIn className="w-6 h-6" /> تسجيل الدخول
                 </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-2xl font-black text-xl border-primary/10">
                 <Link href="/auth/register" className="gap-2">
                    <UserPlus className="w-6 h-6" /> إنشاء حساب جديد
                 </Link>
              </Button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-2 md:px-4 py-8 md:py-12 max-w-5xl">
        <header className="mb-10 text-center space-y-4">
           <div className="w-20 h-20 md:w-24 md:h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary mb-6 luxury-shadow border-4 border-white animate-in zoom-in duration-700">
              <Crown className="w-10 h-10 md:w-12 md:h-12" />
           </div>
           <h1 className="text-2xl md:text-5xl font-black font-headline text-primary">نخبة طلاب سراج</h1>
           <p className="text-muted-foreground text-xs md:text-lg max-w-2xl mx-auto font-medium leading-relaxed px-4">
             قائمة الشرف للطلاب الأكثر تفاعلاً وإنجازاً. تنافس مع زملائك واحصد النقاط لتتصدر القائمة الذهبية.
           </p>
        </header>

        <div className="space-y-8">
          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem]">
            <CardHeader className="bg-muted/20 border-b border-border/50 p-5 md:p-8 text-right flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg md:text-2xl font-black text-primary font-headline">لوحة المتصدرين</CardTitle>
                <CardDescription className="font-bold mt-1 text-[10px] md:text-sm">تُحدث النقاط تلقائياً بناءً على نشاطك الدراسي</CardDescription>
              </div>
              <Trophy className="w-6 h-6 md:w-10 md:h-10 text-secondary opacity-30 shrink-0" />
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="text-right w-full min-w-[300px]">
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="text-center font-black py-4 w-12 md:w-24 px-2">#</TableHead>
                      <TableHead className="text-right font-black py-4 px-2">الطالب</TableHead>
                      <TableHead className="text-center font-black py-4 w-20 md:w-32 px-2">النقاط</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleLeaderboard.map((student, index) => (
                      <TableRow key={student.id} className={cn(
                        "hover:bg-primary/5 transition-colors border-b border-primary/5",
                        index === 0 && "bg-yellow-50/30",
                        index === 1 && "bg-slate-50/30",
                        index === 2 && "bg-orange-50/30"
                      )}>
                        <TableCell className="text-center px-1 md:px-2">
                          <div className={cn(
                            "w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto font-black text-xs md:text-sm transition-transform hover:scale-110 shadow-sm",
                            index === 0 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                            index === 1 ? "bg-slate-100 text-slate-700 border border-slate-200" :
                            index === 2 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {index === 0 ? <Crown className="w-4 h-4 md:w-6 md:h-6" /> : 
                             index === 1 ? <Medal className="w-4 h-4 md:w-5 md:h-5 text-slate-500" /> :
                             index === 2 ? <Medal className="w-4 h-4 md:w-5 md:h-5 text-orange-600" /> :
                             index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-6 px-1 md:px-4">
                          <div className="flex items-center gap-2 md:gap-4 text-right">
                            <Avatar className={cn(
                              "h-10 w-10 md:h-14 md:w-14 border-2 shadow-md shrink-0 aspect-square",
                              index === 0 ? "border-yellow-400" : "border-white"
                            )}>
                              <AvatarImage src={student.photoURL || undefined} className="object-cover" />
                              <AvatarFallback className="bg-primary/5 text-primary font-black text-[10px] md:text-lg">{student.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                              <div className="font-black text-primary text-xs md:text-lg truncate max-w-[80px] md:max-w-none">{student.name}</div>
                              <div className="text-[7px] md:text-[10px] text-muted-foreground font-bold tracking-wider uppercase truncate">
                                {index === 0 ? "البطل الذهبي" : index === 1 ? "المنافس الفضي" : index === 2 ? "المثابر البرونزي" : "طالب سراج"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-1 md:px-2">
                          <div className={cn(
                            "inline-flex items-center gap-1 md:gap-2 px-2 md:px-5 py-1 md:py-2 rounded-xl md:rounded-2xl shadow-inner",
                            index === 0 ? "bg-yellow-100/50" : "bg-secondary/10"
                          )}>
                             <Medal className={cn(
                               "w-3 h-3 md:w-5 md:h-5",
                               index === 0 ? "text-yellow-600 fill-yellow-600" : "text-secondary fill-transparent"
                             )} />
                             <span className={cn(
                               "text-xs md:text-lg font-black",
                               index === 0 ? "text-yellow-700" : "text-secondary"
                             )} dir="ltr">{mounted ? student.totalPoints : '0'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {leaderboard.length > visibleCount && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleLoadMore} 
                variant="outline" 
                className="h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-2xl border-primary/10 bg-white font-black text-primary hover:bg-primary/5 gap-2 shadow-lg text-xs md:text-base"
              >
                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                عرض المزيد من الأبطال
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
