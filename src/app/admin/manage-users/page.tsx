
'use client';

import { useState, useMemo, useEffect, Suspense } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Settings2, 
  Loader2, 
  Copy, 
  Calendar, 
  Trash2, 
  Mail, 
  Phone, 
  PlusCircle,
  X,
  BookOpen,
  BadgeDollarSign,
  ShieldCheck
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, arrayUnion, arrayRemove, addDoc, increment, writeBatch } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function ManageUsersContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("30");

  useEffect(() => {
    setMounted(true);
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);
  
  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);
  const coursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);
  const { data: courses } = useCollection(coursesQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleUpdateUser = async (updates: any) => {
    if (!db || !selectedUser) return;
    setUpdating(true);
    const userRef = doc(db, "users", selectedUser.id);
    
    try {
      await updateDoc(userRef, updates);
      toast({ title: "تم التحديث", description: "تم حفظ التعديلات بنجاح" });
      setSelectedUser({ ...selectedUser, ...updates });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث بيانات المستخدم" });
    } finally {
      setUpdating(false);
    }
  };

  const activateCourse = async () => {
    if (!db || !selectedUser || !selectedCourseId) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى اختيار الدورة أولاً." });
      return;
    }
    
    setUpdating(true);
    
    const selectedCourse = courses?.find(c => c.id === selectedCourseId);
    if (!selectedCourse) {
      toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على بيانات الدورة" });
      setUpdating(false);
      return;
    }

    const userRef = doc(db, "users", selectedUser.id);
    const courseDocRef = doc(db, "courses", selectedCourse.id);
    const now = new Date();
    let expiresAt = null;
    
    if (selectedDuration !== "3650") { 
      expiresAt = new Date();
      expiresAt.setDate(now.getDate() + parseInt(selectedDuration));
    }

    const enrollmentInfo = {
      activatedAt: now.toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      status: "active"
    };

    try {
      // استخدام writeBatch لدمج العمليات وتجنب استنزاف الموارد
      const batch = writeBatch(db);
      
      // 1. تحديث بيانات المستخدم
      batch.update(userRef, {
        enrolledCourses: arrayUnion(selectedCourseId),
        [`enrollmentDetails.${selectedCourseId}`]: enrollmentInfo
      });

      // 2. إضافة سجل الاشتراك المالي
      const subRef = doc(collection(db, "subscriptions"));
      batch.set(subRef, {
        userId: selectedUser.id,
        userEmail: selectedUser.email, 
        userName: selectedUser.name,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        price: Number(selectedCourse.price) || 0,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        durationDays: selectedDuration
      });

      // 3. زيادة عداد الطلاب في الدورة
      batch.update(courseDocRef, {
        studentsCount: increment(1)
      });

      await batch.commit();

      toast({ title: "تم التفعيل", description: "تم منح الطالب حق الوصول وتوثيق العملية مالياً." });
      
      const updatedUser = { ...selectedUser };
      const currentEnrolled = Array.isArray(updatedUser.enrolledCourses) ? [...updatedUser.enrolledCourses] : [];
      if (!currentEnrolled.includes(selectedCourseId)) {
        currentEnrolled.push(selectedCourseId);
      }
      updatedUser.enrolledCourses = currentEnrolled;
      
      if (!updatedUser.enrollmentDetails) updatedUser.enrollmentDetails = {};
      updatedUser.enrollmentDetails[selectedCourseId] = enrollmentInfo;
      setSelectedUser(updatedUser);
      setSelectedCourseId(""); 
      
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تفعيل الدورة" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl text-right" dir="rtl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold font-headline text-primary mb-2">إدارة شؤون الطلاب والدورات</h1>
        <p className="text-muted-foreground">تفعيل الدورات، متابعة الاشتراكات، وإدارة سجلات التعلم للطلاب.</p>
      </header>

      <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
        <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Input 
                placeholder="ابحث بالاسم أو البريد..." 
                className="pr-12 h-12 rounded-2xl bg-background border-primary/10 shadow-sm text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="h-8 px-4 border-primary/20 bg-primary/5 text-primary font-bold">
              إجمالي الطلاب: {users?.length || 0}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">جاري تحميل قائمة الطلاب...</p>
            </div>
          ) : (
            <Table className="text-right">
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-right font-black py-4">الطالب</TableHead>
                  <TableHead className="text-right font-black py-4">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right font-black py-4">المعرف (UID)</TableHead>
                  <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.uid} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-primary/10 shadow-sm">
                          <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/5 text-primary font-bold">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-right">
                          <div className="font-bold text-primary text-sm">{user.name}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {user.phone || "بدون رقم"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-xs text-muted-foreground font-mono">
                      {user.email}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 group" dir="ltr">
                        <code className="text-[10px] bg-muted px-2 py-1 rounded font-mono text-muted-foreground max-w-[100px] truncate">
                          {user.uid}
                        </code>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => {
                          navigator.clipboard.writeText(user.uid);
                          toast({ title: "تم النسخ", description: "تم نسخ المعرف بنجاح" });
                        }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 rounded-xl border-secondary/20 gap-2 font-bold text-secondary hover:bg-secondary/5"
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedCourseId("");
                        }}
                      >
                        <Settings2 className="w-4 h-4" /> إدارة الدورات
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none luxury-shadow [&>button]:hidden" dir="rtl">
          <DialogHeader className="p-8 bg-muted/30 border-b border-border/50 flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
              <AvatarImage src={selectedUser?.photoURL || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary text-white text-xl">{selectedUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-right flex-1">
              <DialogTitle className="text-2xl font-black text-primary font-headline">{selectedUser?.name}</DialogTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedUser?.email}</span>
                {selectedUser?.phone && <span className="flex items-center gap-1 border-r pr-3"><Phone className="w-3.5 h-3.5" /> {selectedUser.phone}</span>}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedUser(null)} 
              className="rounded-full h-12 w-12 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
            >
              <X className="w-7 h-7" />
            </Button>
          </DialogHeader>
          
          <div className="p-8 space-y-10">
            <div className="bg-primary/5 p-6 md:p-8 rounded-[2rem] border border-primary/10">
               <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                 <PlusCircle className="w-5 h-5 text-secondary" /> تفعيل وصول جديد للدورات
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold mr-1">اختر الدورة</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="h-12 rounded-xl bg-background" dir="rtl">
                        <SelectValue placeholder="حدد الدورة لتفعيلها..." />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {courses?.filter(c => {
                          const enrolled = Array.isArray(selectedUser?.enrolledCourses) ? selectedUser.enrolledCourses : [];
                          return !enrolled.includes(c.id);
                        }).map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold mr-1">مدة التفعيل</Label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="h-12 rounded-xl bg-background" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="30">شهر واحد</SelectItem>
                        <SelectItem value="60">شهرين</SelectItem>
                        <SelectItem value="90">3 أشهر</SelectItem>
                        <SelectItem value="120">4 أشهر</SelectItem>
                        <SelectItem value="150">5 أشهر</SelectItem>
                        <SelectItem value="180">6 أشهر</SelectItem>
                        <SelectItem value="365">سنة واحدة</SelectItem>
                        <SelectItem value="3650">مدى الحياة (Unlimited)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>
               <Button 
                  disabled={updating || !selectedCourseId} 
                  onClick={activateCourse}
                  className="w-full h-12 mt-6 bg-secondary text-white hover:bg-secondary/90 rounded-xl font-bold gap-2 shadow-lg shadow-secondary/10"
                >
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  تفعيل الدورة واحتساب العملية مالياً
                </Button>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" /> سجل اشتراكات الطالب النشطة
              </h3>
              <div className="grid gap-4">
                {Array.isArray(selectedUser?.enrolledCourses) && selectedUser.enrolledCourses.length > 0 ? (
                  selectedUser.enrolledCourses.map((courseId: string) => {
                    const courseInfo = courses?.find(c => c.id === courseId);
                    const details = selectedUser?.enrollmentDetails?.[courseId] || {};
                    return (
                      <div key={courseId} className="bg-card border border-border/50 p-4 rounded-2xl flex items-center justify-between gap-4 luxury-shadow">
                        <div className="flex items-center gap-4">
                           <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border/50 shrink-0">
                              {courseInfo?.imageUrl ? (
                                <img src={courseInfo.imageUrl || undefined} className="object-cover w-full h-full" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20"><BookOpen className="w-6 h-6" /></div>
                              )}
                           </div>
                           <div className="text-right">
                             <div className="font-black text-primary text-sm">{courseInfo?.title || "دورة محذوفة"}</div>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-bold">
                                  <Calendar className="w-3 h-3" /> 
                                  {mounted && details.activatedAt ? new Date(details.activatedAt).toLocaleDateString('en-US') : '-'}
                                </span>
                                <span className="text-[9px] text-green-700 font-black flex items-center gap-1">
                                  <BadgeDollarSign className="w-3 h-3" /> 
                                  {courseInfo?.price || 0} YER
                                </span>
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn("px-3 py-1 rounded-lg text-[10px] font-black", details.status === "blocked" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                            {details.status === "blocked" ? "متوقفة" : "نشطة"}
                          </Badge>
                          <Button 
                             disabled={updating}
                             variant="ghost" 
                             size="icon" 
                             className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl" 
                             onClick={() => handleUpdateUser({ enrolledCourses: arrayRemove(courseId) })}
                          >
                             <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-muted/20 rounded-[1.5rem] border border-dashed border-primary/10">
                    <p className="text-sm text-muted-foreground font-bold">لا يوجد اشتراكات مفعلة لهذا الطالب حالياً.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ManageUsersPage() {
  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-50" /></div>}>
        <ManageUsersContent />
      </Suspense>
    </div>
  );
}
