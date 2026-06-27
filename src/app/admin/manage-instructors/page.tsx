
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
  Star, 
  User,
  ShieldCheck,
  Linkedin,
  Instagram,
  Facebook,
  MessageCircle,
  Briefcase
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

export default function ManageInstructorsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [viewType, setViewType] = useState<"table" | "grid">("grid");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const instructorsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "instructors"), orderBy("createdAt", "desc")) : null
  , [db]);

  const { data: instructors, loading } = useCollection(instructorsQuery);

  const handleDelete = async (instructor: any) => {
    if (!db) return;
    setIsDeleting(instructor.id);
    try {
      // نقل للسلة
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: instructor.id,
        originalPath: `instructors/${instructor.id}`,
        type: "instructor",
        title: instructor.name,
        data: instructor,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, "instructors", instructor.id));
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحذف." });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary">إدارة المدربين</h1>
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
              <Link href="/admin/add-instructor">
                <PlusCircle className="w-5 h-5" /> إضافة مدرب
              </Link>
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary opacity-50" />
          </div>
        ) : instructors && instructors.length > 0 ? (
          viewType === "table" ? (
            <Card className="luxury-shadow border border-primary/10 overflow-hidden bg-card/80 backdrop-blur-md rounded-3xl">
              <CardContent className="p-0">
                <Table className="text-right">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right font-bold py-5 px-6 border-l border-primary/5">المدرب</TableHead>
                      <TableHead className="text-center font-bold py-5 border-l border-primary/5">التخصص</TableHead>
                      <TableHead className="text-center font-bold py-5 border-l border-primary/5">التقييم</TableHead>
                      <TableHead className="text-center font-bold py-5 px-6">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructors.map((instructor: any) => (
                      <TableRow key={instructor.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                        <TableCell className="py-5 px-6 border-l border-primary/5">
                          <div className="flex items-center gap-4 text-right">
                            <Avatar className="h-10 w-10 border border-primary/10">
                              <AvatarImage src={instructor.photoURL || undefined} className="object-cover" />
                              <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-primary text-sm leading-tight">{instructor.name}</div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5 text-green-600" /> {instructor.accreditation}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center border-l border-primary/5">
                          <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20 px-2 py-0 text-[10px]">
                            {instructor.specialty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary border-l border-primary/5 text-sm">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-secondary fill-secondary" />
                            {instructor.rating}
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Button asChild variant="outline" size="icon" className="h-8 w-8 rounded-lg border-primary/10">
                              <Link href={`/admin/add-instructor?id=${instructor.id}`}>
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
                                    <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف المدرب؟</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground text-sm font-medium">
                                      سيتم نقل <span className="text-primary font-bold">"{instructor.name}"</span> إلى سلة المهملات.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                </div>
                                <AlertDialogFooter className="flex flex-row gap-3 mt-6">
                                  <AlertDialogAction onClick={() => handleDelete(instructor)} className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1">
                                    تأكيد
                                  </AlertDialogAction>
                                  <AlertDialogCancel className="h-11 rounded-xl border-primary/10 font-bold gap-2 flex-1 mt-0">
                                    إلغاء
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
              {instructors.map((instructor: any) => (
                <Card key={instructor.id} className="overflow-hidden group luxury-shadow flex flex-col h-full rounded-[2.5rem] border border-primary/5 bg-card/80 backdrop-blur-sm transition-all hover:translate-y-[-8px]">
                  <div className="relative aspect-square overflow-hidden max-h-56">
                    <img src={instructor.photoURL || undefined} alt={instructor.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 right-3">
                       <Badge className="bg-secondary text-white border-none px-3 py-1 rounded-xl font-bold text-[10px]">
                          {instructor.accreditation}
                       </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex-grow space-y-4 text-right">
                    <div className="flex items-center justify-between">
                       <h3 className="text-lg font-bold text-primary">{instructor.name}</h3>
                       <div className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-lg">
                          <Star className="w-3 h-3 text-secondary fill-secondary" />
                          <span className="text-xs font-bold text-primary">{instructor.rating}</span>
                       </div>
                    </div>
                    
                    <p className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed opacity-80">{instructor.bio}</p>

                    <div className="flex items-center gap-3 justify-end">
                      {instructor.socials?.whatsapp && (
                        <a href={`https://wa.me/${instructor.socials.whatsapp}`} target="_blank" className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-full hover:scale-110 transition-transform">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      {instructor.socials?.linkedin && (
                        <a href={instructor.socials.linkedin} target="_blank" className="p-2 bg-[#0077B5]/10 text-[#0077B5] rounded-full hover:scale-110 transition-transform">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {instructor.socials?.instagram && (
                        <a href={instructor.socials.instagram} target="_blank" className="p-2 bg-[#E4405F]/10 text-[#E4405F] rounded-full hover:scale-110 transition-transform">
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <div className="pt-4 border-t border-primary/5 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-secondary" />
                          <span className="text-xs font-bold text-primary">{instructor.specialty}</span>
                       </div>
                    </div>
                  </div>

                  <CardFooter className="p-5 pt-0 flex gap-2">
                    <Button asChild variant="outline" className="flex-1 rounded-2xl h-11 font-bold border-primary/10 hover:bg-primary/5 text-xs">
                      <Link href={`/admin/add-instructor?id=${instructor.id}`}>تعديل</Link>
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
                            <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف المدرب؟</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground text-sm font-medium">سيتم نقل "{instructor.name}" إلى سلة المهملات.</AlertDialogDescription>
                          </AlertDialogHeader>
                        </div>
                        <AlertDialogFooter className="flex flex-row gap-3 mt-6">
                          <AlertDialogAction onClick={() => handleDelete(instructor)} className="h-11 rounded-xl bg-primary text-white font-bold gap-2 flex-1">
                            تأكيد
                          </AlertDialogAction>
                          <AlertDialogCancel className="h-11 rounded-xl border-primary/10 font-bold gap-2 flex-1 mt-0">
                            إلغاء
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
            <User className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary mb-6">لا يوجد مدربون مضافون</h3>
            <Button asChild className="h-12 px-8 rounded-2xl bg-primary text-white font-bold">
              <Link href="/admin/add-instructor">أضف مدربك الأول</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
