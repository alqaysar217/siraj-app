'use client';

import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Loader2, 
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Ban,
  UserCheck,
  ShieldAlert,
  KeyRound,
  History
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { resetStudentPassword } from "@/app/actions/admin-auth";

export default function AccountManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [userToStatusChange, setUserToStatusStatusChange] = useState<any>(null);
  const [userToReset, setUserToReset] = useState<any>(null);
  const [userToForceReset, setUserToForceReset] = useState<any>(null);

  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);
  const { data: users, loading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleForcePasswordReset = async () => {
    if (!userToForceReset) return;
    const targetUid = userToForceReset.id || userToForceReset.uid;
    setProcessing(targetUid);
    try {
      const result = await resetStudentPassword(targetUid);
      
      if (result.success) {
        toast({ 
          title: "اكتمل التصفير", 
          description: `تم تغيير كلمة سر "${userToForceReset.name}" إلى "student123" بنجاح.` 
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في التصفير", 
        description: error.message || "فشل تصفير كلمة السر. تأكد من وجود اتصال مستقر." 
      });
    } finally {
      setProcessing(null);
      setUserToForceReset(null);
    }
  };

  const handleResetDevices = async () => {
    if (!db || !userToReset) return;
    const targetUid = userToReset.id || userToReset.uid;
    setProcessing(targetUid);
    try {
      await updateDoc(doc(db, "users", targetUid), {
        deviceIds: [],
        lastSessionId: "reset_" + Date.now() 
      });
      toast({ title: "اكتمل التصفير", description: "تم مسح سجل الأجهزة وإنهاء الجلسات بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تصفير سجل الأجهزة." });
    } finally {
      setProcessing(null);
      setUserToReset(null);
    }
  };

  const confirmToggleStatus = async () => {
    if (!db || !userToStatusChange) return;
    const targetUid = userToStatusChange.id || userToStatusChange.uid;
    setProcessing(targetUid);
    const newStatus = userToStatusChange.status === 'banned' ? 'active' : 'banned';
    try {
      await updateDoc(doc(db, "users", targetUid), { 
        status: newStatus,
        lastSessionId: newStatus === 'banned' ? 'banned_' + Date.now() : userToStatusChange.lastSessionId
      });
      toast({ 
        title: newStatus === 'active' ? "تم التنشيط" : "تم الحظر", 
        description: `حساب ${userToStatusChange.name} أصبح الآن ${newStatus === 'active' ? 'نشطاً' : 'محظوراً ومطروداً'}.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث حالة الحساب." });
    } finally {
      setProcessing(null);
      setUserToStatusStatusChange(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!db || !userToDelete) return;
    const targetUid = userToDelete.id || userToDelete.uid;
    setProcessing(targetUid);
    try {
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: targetUid,
        originalPath: `users/${targetUid}`,
        type: "user",
        title: `حساب: ${userToDelete.name}`,
        data: userToDelete,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, "users", targetUid));
      toast({ title: "تم الحذف", description: "تم نقل الحساب إلى سلة المهملات بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الحساب." });
    } finally {
      setProcessing(null);
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-7xl text-right">
        <header className="mb-10">
          <h1 className="text-3xl font-bold font-headline text-primary mb-2">إدارة الحسابات والأمان</h1>
          <p className="text-muted-foreground">تحكم في صلاحيات الدخول، حظر الأجهزة، وتصفير كلمات السر للطلاب.</p>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
            <div className="relative w-full md:max-w-md">
              <Input 
                placeholder="ابحث عن حساب بالاسم أو البريد..." 
                className="pr-12 h-12 rounded-2xl bg-background border-primary/10 shadow-sm text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">جاري تحميل البيانات الأمنية...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="text-right">
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-right font-black py-4">صاحب الحساب</TableHead>
                      <TableHead className="text-center font-black py-4">أمان كلمة السر</TableHead>
                      <TableHead className="text-center font-black py-4">الأجهزة</TableHead>
                      <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id} className={`hover:bg-primary/5 transition-colors ${user.status === 'banned' ? 'opacity-60 bg-red-50/30' : ''}`}>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-primary/10 shadow-sm">
                              <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                              <AvatarFallback className="bg-primary/5 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-right">
                              <div className="font-bold text-primary text-sm flex items-center gap-2">
                                {user.name}
                                {user.status === 'banned' && <Badge variant="destructive" className="h-4 text-[8px] px-1">محظور</Badge>}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                             <Button 
                                onClick={() => setUserToForceReset(user)}
                                disabled={processing === (user.id || user.uid)}
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg border-primary/20 text-primary font-bold gap-2 text-[10px]"
                             >
                                {user.forcePasswordChange ? <History className="w-3 h-3 text-secondary" /> : <RefreshCw className="w-3 h-3" />}
                                {user.forcePasswordChange ? "بانتظار تغيير الطالب" : "تصفير كلمة السر"}
                             </Button>
                             <span className="text-[8px] text-muted-foreground font-bold">
                                {user.forcePasswordChange ? "سيجبر على التغيير فور دخوله" : "سيعين السر لـ: student123"}
                             </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                           <div className="flex justify-center gap-1">
                              {[0, 1].map(i => (
                                <div key={i} className={`p-1.5 rounded-lg border ${user.deviceIds?.[i] ? 'bg-green-50 border-green-100 text-green-700' : 'bg-muted border-border text-muted-foreground/30'}`}>
                                  <Smartphone className="w-3 h-3" />
                                </div>
                              ))}
                           </div>
                           <p className="text-[8px] mt-1 font-bold text-muted-foreground">{user.deviceIds?.length || 0} / 2 مسجل</p>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              disabled={processing === (user.id || user.uid) || (user.deviceIds?.length || 0) === 0}
                              onClick={() => setUserToReset(user)}
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg border-amber-200 text-amber-700 font-bold gap-1 text-[10px] hover:bg-amber-50"
                              title="تصفير الأجهزة المسجلة"
                            >
                              <RefreshCw className="w-3 h-3" />
                              أجهزة
                            </Button>
                            
                            <Button 
                              disabled={processing === (user.id || user.uid)}
                              onClick={() => setUserToStatusStatusChange(user)}
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 rounded-lg ${user.status === 'banned' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                              title={user.status === 'banned' ? 'إلغاء الحظر' : 'حظر الحساب'}
                            >
                              {user.status === 'banned' ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </Button>

                            <Button 
                              disabled={processing === (user.id || user.uid)}
                              onClick={() => setUserToDelete(user)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:bg-red-50"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-32 text-center">
                 <ShieldCheck className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-primary">لا توجد نتائج بحث مطابقة</h3>
              </div>
            )}
          </CardContent>
        </Card>

        {/* حوار تأكيد تصفير كلمة السر */}
        <AlertDialog open={!!userToForceReset} onOpenChange={(open) => !open && setUserToForceReset(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <KeyRound className="w-10 h-10 text-primary" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">تصفير كلمة السر؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  سيتم تغيير كلمة سر الطالب <span className="text-primary font-bold">"{userToForceReset?.name}"</span> لتصبح <code className="bg-muted px-2 py-0.5 rounded font-black text-secondary">student123</code>. <br />
                  سيتوجب عليه تغييرها فور دخوله للمنصة.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction 
                onClick={handleForcePasswordReset}
                className="h-12 rounded-2xl bg-primary text-white font-black flex-1 hover:bg-primary/90"
              >
                تأكيد التصفير
              </AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* بقية الحوارات */}
        <AlertDialog open={!!userToStatusChange} onOpenChange={(open) => !open && setUserToStatusStatusChange(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${userToStatusChange?.status === 'banned' ? 'bg-green-50' : 'bg-orange-50'}`}>
                {userToStatusChange?.status === 'banned' ? <UserCheck className="w-10 h-10 text-green-600" /> : <ShieldAlert className="w-10 h-10 text-orange-600" />}
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">
                  {userToStatusChange?.status === 'banned' ? 'تنشيط حساب الطالب؟' : 'حظر هذا الطالب؟'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  {userToStatusChange?.status === 'banned' 
                    ? `سيتم إعادة تفعيل صلاحيات "${userToStatusChange?.name}" للدخول فوراً.` 
                    : `سيتم منع "${userToStatusChange?.name}" من دخول المنصة وطرده من أي جلسة نشطة.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction 
                onClick={confirmToggleStatus}
                className={`h-12 rounded-2xl font-black flex-1 text-white ${userToStatusChange?.status === 'banned' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                تأكيد العملية
              </AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!userToReset} onOpenChange={(open) => !open && setUserToReset(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <RefreshCw className="w-10 h-10 text-blue-600" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">تصفير سجل الأجهزة؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  أنت على وشك مسح الأجهزة المسجلة لـ <span className="text-primary font-bold">"{userToReset?.name}"</span>. سيتمكن الطالب من الدخول من أجهزة جديدة تماماً.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction 
                onClick={handleResetDevices}
                className="h-12 rounded-2xl bg-blue-600 text-white font-black flex-1 hover:bg-blue-700"
              >
                تأكيد التصفير
              </AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-10 h-10 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">حذف الحساب نهائياً؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  أنت على وشك حذف حساب <span className="text-primary font-bold">"{userToDelete?.name}"</span> ونقله للسلة. لن يتمكن من الدخول مرة أخرى.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction 
                onClick={handleDeleteUser}
                className="h-12 rounded-2xl bg-primary text-white font-black flex-1 hover:bg-primary/90"
              >
                تأكيد الحذف
              </AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">
                إلغاء
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}