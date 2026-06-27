
"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Trash2, 
  Star, 
  MessageCircle, 
  Loader2, 
  AlertTriangle, 
  X, 
  BookOpen,
  Calendar
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, deleteDoc, query, orderBy, setDoc, serverTimestamp } from "firebase/firestore";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function ManageReviewsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewToDelete, setReviewToDelete] = useState<any>(null);

  const reviewsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "reviews"), orderBy("createdAt", "desc")) : null
  , [db]);

  const { data: reviews, loading } = useCollection(reviewsQuery);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter(r => 
      r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reviews, searchTerm]);

  const handleDelete = async () => {
    if (!db || !reviewToDelete) return;
    try {
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: reviewToDelete.id,
        originalPath: `reviews/${reviewToDelete.id}`,
        type: "review",
        title: `تقييم من ${reviewToDelete.userName}`,
        data: reviewToDelete,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, "reviews", reviewToDelete.id));
      toast({ title: "تم النقل للسلة", description: "تم نقل التقييم إلى سلة المهملات." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف التقييم." });
    } finally {
      setReviewToDelete(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <header className="mb-10 text-right">
          <h1 className="text-3xl font-bold font-headline text-primary mb-2">إدارة مراجعات الطلاب</h1>
          <p className="text-muted-foreground">مراقبة آراء الطلاب وحذف التعليقات غير اللائقة.</p>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:max-w-md">
                <Input 
                  placeholder="ابحث بالاسم، الدورة، أو التعليق..." 
                  className="pr-12 h-12 rounded-2xl bg-background border-primary/10 shadow-sm text-right"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
              <Badge variant="outline" className="h-8 px-4 border-primary/20 bg-primary/5 text-primary font-bold">
                إجمالي التقييمات: {reviews?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">جاري تحميل البيانات...</p>
              </div>
            ) : filteredReviews.length > 0 ? (
              <Table className="text-right">
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-right font-black py-4">الطالب والدورة</TableHead>
                    <TableHead className="text-right font-black py-4">التقييم</TableHead>
                    <TableHead className="text-right font-black py-4 max-w-xs">التعليق</TableHead>
                    <TableHead className="text-right font-black py-4">التاريخ</TableHead>
                    <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review: any) => (
                    <TableRow key={review.id} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-primary/10">
                            <AvatarImage src={review.userPhoto || undefined} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-primary font-bold">{review.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="text-right">
                            <div className="font-bold text-primary text-sm">{review.userName}</div>
                            <div className="text-[10px] text-secondary flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {review.courseTitle}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("w-3.5 h-3.5", i < review.rating ? "text-secondary fill-secondary" : "text-muted")} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 max-w-xs">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                          "{review.comment || 'بدون تعليق'}"
                        </p>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {mounted && review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('ar-YE') : ''}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5"
                          onClick={() => setReviewToDelete(review)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-32 text-center">
                 <MessageCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-primary">لا توجد مراجعات حالياً</h3>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-secondary" />
              </div>
              <AlertDialogHeader className="space-y-2 p-0">
                <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف المراجعة؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed">
                  سيتم نقل رأي الطالب <span className="text-primary font-bold">"{reviewToDelete?.userName}"</span> إلى سلة المهملات.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-6">
              <AlertDialogAction 
                onClick={handleDelete}
                className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1 hover:bg-primary/90"
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
    </div>
  );
}
