
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  RotateCcw, 
  Loader2, 
  AlertTriangle, 
  X, 
  BookOpen, 
  Video, 
  User, 
  MessageSquare,
  ShieldAlert,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, deleteDoc, query, orderBy, setDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
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

export default function TrashPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [processing, setProcessing] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const trashQuery = useMemoFirebase(() => 
    db ? query(collection(db, "trash"), orderBy("deletedAt", "desc")) : null
  , [db]);

  const { data: trashItems, loading } = useCollection(trashQuery);

  const handleRestore = async (item: any) => {
    if (!db) return;
    setProcessing(item.id);
    try {
      const originalRef = doc(db, item.originalPath);
      await setDoc(originalRef, item.data);
      await deleteDoc(doc(db, "trash", item.id));
      toast({ title: "تمت الاستعادة", description: `تم إعادة ${item.title} لمكانه الأصلي.` });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل استعادة العنصر." });
    } finally {
      setProcessing(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!db || !itemToDelete) return;
    setProcessing(itemToDelete.id);
    try {
      await deleteDoc(doc(db, "trash", itemToDelete.id));
      toast({ title: "تم الحذف النهائي", description: "تم مسح البيانات من الخادم تماماً." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحذف النهائي." });
    } finally {
      setProcessing(null);
      setItemToDelete(null);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "course": return <BookOpen className="w-4 h-4 text-primary" />;
      case "lesson": return <Video className="w-4 h-4 text-blue-500" />;
      case "instructor": return <User className="w-4 h-4 text-secondary" />;
      case "review": return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case "user": return <ShieldAlert className="w-4 h-4 text-destructive" />;
      default: return <Trash2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "course": return "دورة تعليمية";
      case "lesson": return "درس / اختبار";
      case "instructor": return "مدرب";
      case "review": return "تقييم طالب";
      case "user": return "حساب طالب";
      default: return "غير محدد";
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <header className="mb-10 text-right">
          <h1 className="text-3xl font-bold font-headline text-primary mb-2">سلة المهملات</h1>
          <p className="text-muted-foreground">استعادة أو حذف العناصر المحذوفة نهائياً من قاعدة البيانات.</p>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-black text-primary">العناصر المحذوفة مؤخراً</CardTitle>
            <Badge variant="outline" className="border-secondary/20 bg-secondary/5 text-secondary">
              إجمالي العناصر: {trashItems?.length || 0}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-bold">جاري تحميل السلة...</p>
              </div>
            ) : trashItems && trashItems.length > 0 ? (
              <Table className="text-right">
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-right font-black py-4">العنصر</TableHead>
                    <TableHead className="text-right font-black py-4">النوع</TableHead>
                    <TableHead className="text-right font-black py-4">تاريخ الحذف</TableHead>
                    <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashItems.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                      <TableCell className="py-4 font-bold text-primary">{item.title}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {getItemIcon(item.type)}
                          <span className="text-xs font-medium">{getTypeName(item.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {mounted && item.deletedAt?.toDate ? item.deletedAt.toDate().toLocaleString('ar-YE') : ''}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            disabled={processing === item.id}
                            variant="outline" 
                            size="sm" 
                            className="h-9 rounded-xl gap-2 font-bold border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => handleRestore(item)}
                          >
                            {processing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            استعادة
                          </Button>
                          <Button 
                            disabled={processing === item.id}
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5"
                            onClick={() => setItemToDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-32 text-center">
                <Trash2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-primary">سلة المهملات فارغة حالياً</h3>
                <p className="text-muted-foreground text-sm mt-2">عند قيامك بحذف أي محتوى سيظهر هنا لإمكانية استعادته.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4 flex-row-reverse text-right">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm text-amber-700 font-bold">ملاحظة هامة للمسؤول</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              استعادة العنصر ستعيده لمكانه الأصلي مع كافة بياناته. في حال حذف الدورة الأصلية التي يتبع لها الدرس، قد لا تنجح استعادة الدرس إلا بعد استعادة الدورة أولاً.
            </p>
          </div>
        </div>

        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-8 bg-card/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-headline text-primary font-black">حذف نهائي؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed">
                  أنت على وشك حذف <span className="text-primary font-bold">"{itemToDelete?.title}"</span> بشكل نهائي من الخادم. <br />
                  <span className="text-destructive font-bold">لا يمكن التراجع عن هذا الإجراء أبداً.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <div className="flex flex-row gap-3 mt-8">
              <Button 
                onClick={handlePermanentDelete}
                className="h-12 rounded-2xl bg-primary text-white font-bold gap-2 flex-1 hover:bg-primary/90 shadow-lg shadow-primary/10"
              >
                تأكيد الحذف النهائي
              </Button>
              <Button 
                variant="outline"
                onClick={() => setItemToDelete(null)}
                className="h-12 rounded-2xl border-primary/10 font-bold gap-2 flex-1"
              >
                إلغاء
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
