
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, UserCheck, Settings2, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UsersManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // تثبيت المراجع لمنع الحلقة اللانهائية
  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);
  const coursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);

  const { data: users, loading } = useCollection(usersQuery);
  const { data: courses } = useCollection(coursesQuery);

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activateCourseForUser = async (userId: string, courseId: string) => {
    if (!db) return;
    setUpdating(userId);
    const userRef = doc(db, "users", userId);
    const courseRef = doc(db, "courses", courseId);
    
    try {
      // 1. تفعيل الدورة للطالب
      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(courseId)
      });
      
      // 2. زيادة عداد الطلاب في الدورة تلقائياً (+1)
      await updateDoc(courseRef, {
        studentsCount: increment(1)
      });

      toast({ title: "تم التفعيل", description: "تم منح الطالب حق الوصول للدورة وزيادة عداد الطلاب بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تفعيل الدورة أو تحديث العداد." });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary mb-2">إدارة الطلاب والاشتراكات 👥</h1>
            <p className="text-muted-foreground">قم بتفعيل الدورات يدوياً للطلاب بعد تأكيد الدفع.</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/admin/dashboard" className="gap-2">
              العودة للوحة التحكم <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </header>

        <Card className="luxury-shadow border-secondary/10 overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6 border-b">
            <div className="relative max-w-md mr-auto">
              <Input 
                placeholder="ابحث عن طالب بالاسم أو البريد..." 
                className="pr-10 h-11 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-secondary mx-auto" />
              </div>
            ) : (
              <Table className="text-right">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الطالب</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الدورات المشترك بها</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: any) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-bold">{user.name}</TableCell>
                      <TableCell className="text-xs">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.enrolledCourses?.length || 0} دورات
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                              <ShieldCheck className="w-4 h-4 text-secondary" />
                              تفعيل دورة
                            </Button>
                          </DialogTrigger>
                          <DialogContent dir="rtl">
                            <DialogHeader className="text-right">
                              <DialogTitle>تفعيل دورة للطالب: {user.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <p className="text-sm text-muted-foreground">اختر الدورة التي تريد تفعيلها لهذا الطالب يدوياً:</p>
                              <div className="grid gap-2">
                                {courses?.map((course: any) => {
                                  const isEnrolled = user.enrolledCourses?.includes(course.id);
                                  return (
                                    <div key={course.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                                      <span className="font-medium">{course.title}</span>
                                      {isEnrolled ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">مفعلة</Badge>
                                      ) : (
                                        <Button 
                                          size="sm" 
                                          disabled={updating === user.uid}
                                          onClick={() => activateCourseForUser(user.uid, course.id)}
                                          className="bg-primary text-white"
                                        >
                                          تفعيل الآن
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
