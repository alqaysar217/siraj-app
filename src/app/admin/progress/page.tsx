
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Loader2, 
  Award, 
  BookOpen, 
  Star, 
  Trash2, 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff, 
  Search,
  User as UserIcon,
  Crown,
  Medal
} from "lucide-react";
import { useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, query, orderBy, limit, doc, deleteDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StudentProgressPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const usersQuery = useMemoFirebase(() => 
    db ? query(collection(db, "users")) : null
  , [db]);
  
  const { data: users, loading } = useCollection(usersQuery);

  const leaderboard = useMemo(() => {
    if (!users) return [];

    let list = users.map((user: any) => {
      const progressEntries = Object.values(user.progress || {});
      const totalPoints = progressEntries.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0);
      const totalCompletedLessons = progressEntries.reduce((acc: number, curr: any) => acc + (curr.completedLessons?.length || 0), 0);
      
      return {
        ...user,
        totalPoints,
        totalCompletedLessons
      };
    }).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.totalCompletedLessons - a.totalCompletedLessons;
    });

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(u => 
        u.name?.toLowerCase().includes(s) || 
        u.email?.toLowerCase().includes(s)
      );
    }

    // احتساب الرتبة باستخدام Dense Ranking (الترتيب الكثيف)
    // لضمان حصول الطلاب المتساوين في النقاط على نفس المركز
    let currentRank = 1;
    return list.map((student, index, array) => {
      if (index > 0 && student.totalPoints < array[index - 1].totalPoints) {
        currentRank++;
      }
      return { ...student, displayRank: currentRank };
    });
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    if (!leaderboard.length) return { totalStudents: 0, avgPoints: 0 };
    const totalPointsSum = leaderboard.reduce((acc, curr) => acc + curr.totalPoints, 0);
    return {
      totalStudents: leaderboard.length,
      avgPoints: Math.round(totalPointsSum / leaderboard.length)
    };
  }, [leaderboard]);

  const handleToggleVisibility = async (student: any) => {
    if (!db) return;
    setProcessing(student.uid);
    const newStatus = student.showInLeaderboard === false;
    
    try {
      await updateDoc(doc(db, "users", student.uid), {
        showInLeaderboard: newStatus
      });
      toast({ 
        title: newStatus ? "تم الإظهار" : "تم الإخفاء", 
        description: newStatus ? "سيظهر الطالب الآن في اللوحة العامة." : "تم حظر ظهور الطالب في اللوحة العامة للطلاب."
      });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة الظهور." });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!db || !userToDelete) return;
    setProcessing(userToDelete.uid);

    try {
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: userToDelete.uid,
        originalPath: `users/${userToDelete.uid}`,
        type: "user",
        title: `حساب الطالب: ${userToDelete.name}`,
        data: userToDelete,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, "users", userToDelete.uid));
      toast({ title: "تم الحذف", description: "تم نقل الطالب إلى سلة المهملات." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في عملية الحذف." });
    } finally {
      setProcessing(null);
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <header className="mb-10 text-right space-y-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary mb-2">تقدم الطلاب واللوحة الشرفية</h1>
            <p className="text-muted-foreground">متابعة دقيقة لمستوى تفاعل الطلاب وإنجازاتهم التعليمية عبر كافة الدورات.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <div className="relative flex-1 w-full">
              <Input 
                placeholder="ابحث عن طالب بالاسم أو البريد..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 rounded-2xl bg-card border-primary/10 pr-12 shadow-sm"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="luxury-shadow border-primary/5">
            <CardContent className="p-6 flex items-center gap-4 flex-row-reverse">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-right flex-1">
                <div className="text-2xl font-black text-primary" dir="ltr">{mounted ? stats.totalStudents : '0'}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">إجمالي الطلاب</div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-primary/5">
            <CardContent className="p-6 flex items-center gap-4 flex-row-reverse">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 text-secondary" />
              </div>
              <div className="text-right flex-1">
                <div className="text-2xl font-black text-primary" dir="ltr">{mounted ? stats.avgPoints : '0'}</div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">متوسط نقاط التفاعل</div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-primary/5">
            <CardContent className="p-6 flex items-center gap-4 flex-row-reverse">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-right flex-1">
                <div className="text-2xl font-black text-primary" dir="ltr">{mounted && leaderboard.length > 0 ? leaderboard[0].totalPoints : '0'}</div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">أعلى رصيد نقاط</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 border-b border-border/50 text-right p-8">
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-2xl font-black text-primary font-headline">قائمة المتصدرين</CardTitle>
                  <CardDescription className="font-bold mt-1">الطلاب الأكثر حصداً للنقاط من خلال المشاهدة والاختبارات</CardDescription>
               </div>
               <TrendingUp className="w-8 h-8 text-secondary opacity-20" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">جاري تحليل بيانات الطلاب...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              <Table className="text-right">
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-center font-black py-5 w-20">المركز</TableHead>
                    <TableHead className="text-right font-black py-5">الطالب</TableHead>
                    <TableHead className="text-center font-black py-5">الدروس</TableHead>
                    <TableHead className="text-center font-black py-5">النقاط</TableHead>
                    <TableHead className="text-center font-black py-5">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((student) => {
                    const isVisible = student.showInLeaderboard !== false;
                    const rank = student.displayRank;
                    return (
                      <TableRow key={student.uid} className={cn("hover:bg-primary/5 transition-colors border-b border-primary/5", !isVisible && "bg-muted/20 opacity-80")}>
                        <TableCell className="text-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mx-auto font-black text-sm",
                            rank === 1 ? "bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200" :
                            rank === 2 ? "bg-slate-100 text-slate-700 border border-slate-200" :
                            rank === 3 ? "bg-orange-100 text-orange-700 border border-orange-200" :
                            "bg-muted text-muted-foreground"
                          )} dir="ltr">
                            {rank === 1 ? <Crown className="w-4 h-4 text-yellow-600" /> : 
                             rank === 2 ? <Medal className="w-4 h-4 text-slate-500" /> :
                             rank === 3 ? <Medal className="w-4 h-4 text-orange-600" /> :
                             rank}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4 text-right">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                              <AvatarImage src={student.photoURL || undefined} className="object-cover" />
                              <AvatarFallback className="bg-primary/5 text-primary font-black">{student.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-black text-primary text-base">{student.name}</div>
                              <div className="text-[10px] text-muted-foreground font-bold">{student.email}</div>
                              {!isVisible && <Badge variant="destructive" className="mt-1 h-5 text-[9px] px-2">مخفي من اللوحة العامة</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                             <span className="text-sm font-black text-primary" dir="ltr">{mounted ? student.totalCompletedLessons : '0'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 rounded-full">
                             <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                             <span className="text-sm font-black text-secondary" dir="ltr">{mounted ? student.totalPoints : '0'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              disabled={processing === student.uid}
                              variant="outline" 
                              size="icon" 
                              className={cn(
                                "h-9 w-9 rounded-xl transition-all",
                                isVisible ? "text-secondary border-secondary/20 hover:bg-secondary/5" : "bg-secondary text-white border-none"
                              )}
                              onClick={() => handleToggleVisibility(student)}
                              title={isVisible ? "إخفاء من اللوحة العامة" : "إظهار في اللوحة العامة"}
                            >
                              {processing === student.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5"
                              onClick={() => setUserToDelete(student)}
                              title="حذف ونقل للسلة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-32 text-center">
                 <Award className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
                 <h3 className="text-xl font-bold text-primary">لا يوجد بيانات للطلاب حالياً</h3>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-secondary" />
              </div>
              <AlertDialogHeader className="space-y-2 p-0">
                <AlertDialogTitle className="text-xl font-headline text-primary font-black">إخفاء/حذف الطالب؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed">
                  أنت على وشك حذف الطالب <span className="text-primary font-bold">"{userToDelete?.name}"</span> ونقله لسلة المهملات.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-6">
              <AlertDialogAction 
                onClick={handleDeleteUser}
                disabled={processing === userToDelete?.uid}
                className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1 hover:bg-primary/90"
              >
                {processing === userToDelete?.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                تأكيد الحذف
              </AlertDialogAction>
              <AlertDialogCancel className="h-11 rounded-xl border-primary/10 font-bold gap-2 flex-1 mt-0">
                <X className="w-4 h-4" /> إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
