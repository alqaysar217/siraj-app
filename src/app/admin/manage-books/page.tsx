
"use client";

import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Trash2, 
  PlusCircle, 
  Loader2, 
  AlertTriangle, 
  LayoutList, 
  LayoutGrid, 
  Star, 
  Library,
  Tags,
  User,
  ArrowRight,
  FileText
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
} from "@/components/ui/alert-dialog";
import Image from "next/image";

export default function ManageBooksPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [viewType, setViewType] = useState<"table" | "grid">("grid");
  const [bookToDelete, setBookToDelete] = useState<any>(null);

  const booksQuery = useMemoFirebase(() => 
    db ? query(collection(db, "books"), orderBy("createdAt", "desc")) : null
  , [db]);

  const { data: books, loading } = useCollection(booksQuery);

  const handleDelete = async () => {
    if (!db || !bookToDelete) return;
    try {
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: bookToDelete.id,
        originalPath: `books/${bookToDelete.id}`,
        type: "book",
        title: bookToDelete.title,
        data: bookToDelete,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, "books", bookToDelete.id));
      toast({ title: "تم الحذف", description: "نُقل الكتاب لسلة المهملات." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحذف." });
    } finally {
      setBookToDelete(null);
    }
  };

  const getFormatName = (format: string) => {
    const formats: Record<string, string> = {
      paper: "نسخة ورقية",
      digital: "نسخة رقمية",
      both: "ورقي + رقمي"
    };
    return formats[format] || format;
  };

  const getCategoryName = (slug: string) => {
    const categories: Record<string, string> = {
      programming: "البرمجة والويب",
      design: "التصميم والإبداع",
      management: "الإدارة والمالية",
      general: "كتب عامة",
      accounting: "المحاسبة",
      web: "تطوير الويب"
    };
    return categories[slug] || slug;
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary">إدارة المكتبة</h1>
            <p className="text-muted-foreground text-sm">أضف وتحكم في الكتب المتوفرة في المنصة.</p>
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
              <Link href="/admin/add-book">
                <PlusCircle className="w-5 h-5" /> إضافة كتاب
              </Link>
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-50" />
          </div>
        ) : books && books.length > 0 ? (
          viewType === "table" ? (
            <Card className="luxury-shadow border border-primary/10 overflow-hidden bg-card/80 backdrop-blur-md rounded-3xl">
              <CardContent className="p-0">
                <Table className="text-right">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right font-bold py-5 px-6">الكتاب</TableHead>
                      <TableHead className="text-center font-bold py-5">المؤلف</TableHead>
                      <TableHead className="text-center font-bold py-5">السعر</TableHead>
                      <TableHead className="text-center font-bold py-5">النوع</TableHead>
                      <TableHead className="text-center font-bold py-5">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book: any) => (
                      <TableRow key={book.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                        <TableCell className="py-5 px-6">
                          <div className="flex items-center gap-4 text-right">
                            <div className="relative w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-primary/10">
                              {book.imageUrl ? (
                                <img src={book.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Library className="w-5 h-5 text-muted-foreground/30" /></div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-primary text-sm leading-tight">{book.title}</div>
                              <div className="text-[10px] text-muted-foreground">{getCategoryName(book.category)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-sm">{book.author}</TableCell>
                        <TableCell className="text-center font-bold text-primary text-sm">{book.price} ر.ي</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px]">{getFormatName(book.format)}</Badge>
                        </TableCell>
                        <TableCell className="text-center px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg border-primary/10">
                              <Link href={`/admin/add-book?id=${book.id}`}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg border-primary/10" title="إدارة الفصول">
                              <Link href={`/admin/book-content?id=${book.id}`}>
                                <LayoutList className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button 
                              onClick={() => setBookToDelete(book)}
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg border-secondary/10 text-secondary"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book: any) => (
                <Card key={book.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-[1.5rem] border border-primary/5 bg-card/80 backdrop-blur-sm transition-all hover:translate-y-[-4px]">
                  {/* الغلاف والنوع */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {book.imageUrl ? (
                      <Image 
                        src={book.imageUrl} 
                        alt={book.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center"><Library className="w-12 h-12 text-muted-foreground/20" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-secondary/90 text-white border-none px-3 py-1 rounded-xl shadow-lg font-bold text-[9px]">
                        {getFormatName(book.format)}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex-grow space-y-4 text-right">
                    {/* السطر الأول: العنوان */}
                    <h3 className="text-lg font-black text-primary line-clamp-1 leading-tight group-hover:text-secondary transition-colors">
                      {book.title}
                    </h3>
                    
                    {/* السطر الثاني: المؤلف والمجال */}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5 text-secondary" />
                        <span>{book.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Tags className="w-3.5 h-3.5 text-secondary" />
                        <span>{getCategoryName(book.category)}</span>
                      </div>
                    </div>
                    
                    {/* السطر الثالث: إحصائيات الكتاب والنجوم */}
                    <div className="bg-muted/30 rounded-2xl p-3 space-y-3 border border-primary/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-secondary fill-secondary" />
                            <span className="text-[10px] font-black text-primary">{book.rating || 5.0}</span>
                          </div>
                          <div className="flex items-center gap-1 border-r pr-3 border-primary/10">
                            <FileText className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] font-black text-primary">{book.pages} صفحة</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-secondary">{book.price} <small className="text-[8px]">ر.ي</small></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardFooter className="p-5 pt-0 flex gap-2">
                    <Button asChild variant="outline" className="flex-1 rounded-xl h-10 font-bold border-primary/10 hover:bg-primary/5 text-[10px]">
                      <Link href={`/admin/add-book?id=${book.id}`}>تعديل</Link>
                    </Button>
                    <Button asChild variant="outline" size="icon" className="rounded-xl h-10 w-10 border-primary/10 text-primary hover:bg-primary/5" title="إدارة الفصول">
                      <Link href={`/admin/book-content?id=${book.id}`}>
                        <LayoutList className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => setBookToDelete(book)}
                      variant="outline" 
                      size="icon" 
                      className="rounded-xl h-10 w-10 border-secondary/10 text-secondary hover:bg-secondary/5"
                    >
                       <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="py-32 text-center bg-card/50 rounded-3xl border border-dashed border-primary/20">
            <Library className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary mb-6">المكتبة فارغة حالياً</h3>
            <Button asChild className="h-12 px-8 rounded-2xl bg-primary text-white font-bold">
              <Link href="/admin/add-book">أضف كتابك الأول</Link>
            </Button>
          </div>
        )}

        <AlertDialog open={!!bookToDelete} onOpenChange={(open) => !open && setBookToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">حذف الكتاب؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  أنت على وشك حذف كتاب <span className="text-primary font-bold">"{bookToDelete?.title}"</span> ونقله للسلة.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction 
                onClick={handleDelete}
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
