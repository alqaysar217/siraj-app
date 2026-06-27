
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
  Copy,
  Check,
  Mail,
  Send
} from "lucide-react";
import { useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { sendPasswordResetEmail } from "firebase/auth";
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

export default function AccountManagementPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [userToStatusChange, setUserToStatusStatusChange] = useState<any>(null);
  const [userToReset, setUserToReset] = useState<any>(null);
  const [userToSendReset, setUserToSendReset] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);
  const { data: users, loading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "تم النسخ", description: `تم نسخ ${type} بنجاح.` });
  };

  const handleSendResetEmail = async () => {
    if (!auth || !userToSendReset?.email) return;
    const targetEmail = userToSendReset.email.trim().toLowerCase();
    const targetUid = userToSendReset.id;
    
    setProcessing(targetUid);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      toast({ 
        title: "تم إرسال الرابط", 
        description: `تم إرسال بريد استعادة كلمة السر إلى ${targetEmail} بنجاح.` 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "فشل الإرسال", 
        description: "تأكد من تفعيل موفر البريد في Firebase Console وصحة العنوان." 
      });
    } finally {
      setProcessing(null);
      setUserToSendReset(null);
    }
  };

  const handleResetDevices = async () => {
    if (!db || !userToReset) return;
    const targetUid = userToReset.id;
    setProcessing(targetUid);
    try {
      await updateDoc(doc(db, "users", targetUid), {
        deviceIds: [],
        lastSessionId: "reset_" + Date.now() 
      });
      toast({ title: "تم التصفير", description: "تم مسح سجل الأجهزة وإنهاء كافة الجلسات." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تصفير سجل الأجهزة." });
    } finally {
      setProcessing(null);
      setUserToReset(null);
    }
  };

  const confirmToggleStatus = async () => {
    if (!db || !userToStatusChange) return;
    const targetUid = userToStatusChange.id;
    setProcessing(targetUid);
    const newStatus = userToStatusChange.status === 'banned' ? 'active' : 'banned';
    try {
      await updateDoc(doc(db, "users", targetUid), { 
        status: newStatus,
        lastSessionId: newStatus === 'banned' ? 'banned_' + Date.now() : (userToStatusChange.lastSessionId || "")
      });
      toast({ title: newStatus === 'active' ? "تم التنشيط" : "تم الحظر", description: `حساب ${userToStatusChange.name} أصبح ${newStatus === 'active' ? 'نشطاً' : 'محظوراً'}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الحالة." });
    } finally {
      setProcessing(null);
      setUserToStatusStatusChange(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!db || !userToDelete) return;
    const targetUid = userToDelete.id;
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
      toast({ title: "تم الحذف", description: "تم نقل الحساب إلى سلة المهملات." });
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
          <p className="text-muted-foreground text-sm">تحكم في صلاحيات الدخول، حظر الأجهزة، وإرسال روابط استعادة كلمة السر الرسمية.</p>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="ابحث بالاسم، البريد، أو الـ UID..." 
                className="pr-12 h-12 rounded-2xl bg-background border-primary/10 shadow-sm text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">جاري تحميل البيانات...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="text-right">
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-right font-black py-4">صاحب الحساب</TableHead>
                      <TableHead className="text-right font-black py-4">بيانات التحقق</TableHead>
                      <TableHead className="text-center font-black py-4">كلمة السر</TableHead>
                      <TableHead className="text-center font-black py-4">الأجهزة</TableHead>
                      <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => {
                      const userUid = user.id;
                      return (
                        <TableRow key={user.id} className={`hover:bg-primary/5 transition-colors ${user.status === 'banned' ? 'opacity-60 bg-red-50/30' : ''}`}>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-primary/10 shadow-sm shrink-0">
                                <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="text-right overflow-hidden">
                                <div className="font-bold text-primary text-sm flex items-center gap-2">
                                  {user.name}
                                  {user.status === 'banned' && <Badge variant="destructive" className="h-4 text-[8px] px-1">محظور</Badge>}
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary transition-colors" onClick={() => handleCopy(user.email, "البريد")}>
                                  <Mail className="w-2.5 h-2.5" /> <span className="truncate">{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleCopy(userUid, "المعرف")}>
                                   <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">UID: {userUid}</span>
                                   {copiedId === userUid ? <Check className="w-2.5 h-2.5 text-green-600" /> : <Copy className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                <div className="text-[9px] font-bold text-primary/60">الدورات: {user.enrolledCourses?.length || 0}</div>
                             </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <Button 
                              onClick={() => setUserToSendReset(user)}
                              disabled={processing === userUid}
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg border-primary/20 text-primary font-bold gap-2 text-[10px] hover:bg-primary/5"
                            >
                               <Send className="w-3 h-3" /> إرسال رابط استعادة
                            </Button>
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
                              <Button disabled={processing === userUid || (user.deviceIds?.length || 0) === 0} onClick={() => setUserToReset(user)} variant="outline" size="sm" className="h-8 rounded-lg border-amber-200 text-amber-700 font-bold gap-1 text-[10px] hover:bg-amber-50"><RefreshCw className="w-3 h-3" /> تصفير أجهزة</Button>
                              <Button disabled={processing === userUid} onClick={() => setUserToStatusStatusChange(user)} variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${user.status === 'banned' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}>{user.status === 'banned' ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</Button>
                              <Button disabled={processing === userUid} onClick={() => setUserToDelete(user)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

        <AlertDialog open={!!userToSendReset} onOpenChange={(open) => !open && setUserToSendReset(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6"><KeyRound className="w-10 h-10 text-primary" /></div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">إرسال رابط استعادة؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">سيتم إرسال بريد إلكتروني رسمي للطالب <span className="text-primary font-bold">"{userToSendReset?.name}"</span> يحتوي على رابط آمن لاختيار كلمة سر جديدة بنفسه.</AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction onClick={handleSendResetEmail} className="h-12 rounded-2xl bg-primary text-white font-black flex-1 hover:bg-primary/90">تأكيد الإرسال</AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!userToStatusChange} onOpenChange={(open) => !open && setUserToStatusStatusChange(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${userToStatusChange?.status === 'banned' ? 'bg-green-50' : 'bg-orange-50'}`}>
                {userToStatusChange?.status === 'banned' ? <UserCheck className="w-10 h-10 text-green-600" /> : <ShieldAlert className="w-10 h-10 text-orange-600" />}
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">{userToStatusChange?.status === 'banned' ? 'تنشيط حساب الطالب؟' : 'حظر هذا الطالب؟'}</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">{userToStatusChange?.status === 'banned' ? `سيتم إعادة تفعيل صلاحيات "${userToStatusChange?.name}" للدخول.` : `سيتم منع "${userToStatusChange?.name}" من دخول المنصة.`}</AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction onClick={confirmToggleStatus} className={`h-12 rounded-2xl font-black flex-1 text-white ${userToStatusChange?.status === 'banned' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>تأكيد</AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!userToReset} onOpenChange={(open) => !open && setUserToReset(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6"><RefreshCw className="w-10 h-10 text-blue-600" /></div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">تصفير سجل الأجهزة؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">سيتم مسح الأجهزة المسجلة لـ <span className="text-primary font-bold">"{userToReset?.name}"</span>، وسيتمكن من الدخول من أجهزة جديدة.</AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction onClick={handleResetDevices} className="h-12 rounded-2xl bg-blue-600 text-white font-black flex-1 hover:bg-blue-700">تأكيد التصفير</AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6"><Trash2 className="w-10 h-10 text-destructive" /></div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">حذف الحساب نهائياً؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">أنت على وشك حذف حساب <span className="text-primary font-bold">"{userToDelete?.name}"</span> ونقله للسلة.</AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction onClick={handleDeleteUser} className="h-12 rounded-2xl bg-primary text-white font-black flex-1 hover:bg-primary/90">تأكيد الحذف</AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
