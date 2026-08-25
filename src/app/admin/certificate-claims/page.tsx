
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
  Copy, 
  Check, 
  Calendar,
  MapPin,
  UserCheck,
  ArrowDownWideNarrow,
  Download,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase/provider";
import { collection, query, orderBy, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function CertificateClaimsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claimToDelete, setClaimToDelete] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const claimsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "certificate_claims"), orderBy("updatedAt", "desc"));
  }, [db]);
  const { data: claims, loading } = useCollection(claimsQuery);

  const coursesQuery = useMemoFirebase(() => db ? collection(db, "courses") : null, [db]);
  const { data: courses } = useCollection(coursesQuery);

  const filteredClaims = useMemo(() => {
    if (!claims) return [];
    return claims.filter(c => {
      const matchSearch = (c.nameAr || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.nameEn || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchCourse = filterCourse === "all" || c.courseId === filterCourse;
      return matchSearch && matchCourse;
    });
  }, [claims, searchTerm, filterCourse]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "تم النسخ" });
  };

  const handleDelete = async () => {
    if (!db || !claimToDelete) return;
    setProcessing(claimToDelete.id);
    try {
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: claimToDelete.id,
        originalPath: `certificate_claims/${claimToDelete.id}`,
        type: "certificate_claim",
        title: `طلب بيانات شهادة: ${claimToDelete.nameAr}`,
        data: claimToDelete,
        deletedAt: serverTimestamp()
      });

      await deleteDoc(doc(db, "certificate_claims", claimToDelete.id));
      toast({ title: "تم الحذف", description: "تم نقل الطلب لسلة المهملات لإعادة الرصد." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الطلب." });
    } finally {
      setProcessing(null);
      setClaimToDelete(null);
    }
  };

  const exportToCSV = () => {
    if (!filteredClaims.length) return;
    const headers = ["Course", "Name (Arabic)", "Name (English)", "Address", "Email", "Date"];
    const rows = filteredClaims.map(c => [
      `"${c.courseTitle}"`,
      `"${c.nameAr}"`,
      `"${c.nameEn}"`,
      `"${c.address}"`,
      `"${c.userEmail}"`,
      c.updatedAt?.toDate ? new Date(c.updatedAt.toDate()).toLocaleDateString('ar-YE') : '-'
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `سراج_بيانات_الشهادات_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-right space-y-2">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-primary text-white rounded-2xl shadow-xl">
                  <UserCheck className="w-8 h-8" />
               </div>
               <h1 className="text-3xl font-black font-headline text-primary">طلبات بيانات الشهادات</h1>
            </div>
            <p className="text-muted-foreground font-bold">إدارة الأسماء الرباعية والعناوين المدخلة من قبل الطلاب.</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="rounded-xl border-primary/10 h-12 gap-2 font-bold hover:bg-primary/5">
             <Download className="w-5 h-5 text-secondary" /> تصدير CSV
          </Button>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 pb-8 border-b border-border/50">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="relative">
                   <Input 
                      placeholder="بحث بالاسم أو البريد..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 pr-12 rounded-xl bg-white border-primary/10 shadow-sm text-right"
                   />
                   <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <div className="relative">
                   <Select value={filterCourse} onValueChange={setFilterCourse}>
                      <SelectTrigger dir="rtl" className="h-12 rounded-xl bg-white border-primary/10 shadow-sm font-bold">
                         <SelectValue placeholder="تصفية حسب الدورة" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                         <SelectItem value="all">كل الدورات</SelectItem>
                         {courses?.map((c: any) => (
                           <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>
                <div className="flex items-center justify-end px-4">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">إجمالي الطلبات</p>
                      <p className="text-xl font-black text-primary">{filteredClaims.length}</p>
                   </div>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-32 text-center"><Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" /><p className="text-muted-foreground font-bold">جاري تحميل السجلات...</p></div>
            ) : filteredClaims.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="text-right">
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-right font-black py-5 px-6">الدورة والطالب</TableHead>
                      <TableHead className="text-right font-black py-5">الاسم الرباعي (عربي)</TableHead>
                      <TableHead className="text-right font-black py-5">الاسم الرباعي (إنجليزي)</TableHead>
                      <TableHead className="text-right font-black py-5">العنوان</TableHead>
                      <TableHead className="text-center font-black py-5">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim: any) => (
                      <TableRow key={claim.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                        <TableCell className="py-5 px-6">
                           <div className="text-right space-y-1">
                              <div className="font-black text-primary text-xs truncate max-w-[150px]">{claim.courseTitle}</div>
                              <div className="text-[9px] text-muted-foreground font-bold">{claim.userEmail}</div>
                           </div>
                        </TableCell>
                        <TableCell className="py-5">
                           <div className="flex items-center gap-2 group">
                              <span className="font-bold text-slate-800 text-sm">{claim.nameAr}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-secondary opacity-0 group-hover:opacity-100" onClick={() => handleCopy(claim.nameAr, `${claim.id}_ar`)}>
                                 {copiedId === `${claim.id}_ar` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                           </div>
                        </TableCell>
                        <TableCell className="py-5">
                           <div className="flex items-center gap-2 group" dir="ltr">
                              <span className="font-bold text-slate-800 text-sm">{claim.nameEn}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-secondary opacity-0 group-hover:opacity-100" onClick={() => handleCopy(claim.nameEn, `${claim.id}_en`)}>
                                 {copiedId === `${claim.id}_en` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                           </div>
                        </TableCell>
                        <TableCell className="py-5">
                           <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground max-w-[150px] truncate">
                              <MapPin className="w-3 h-3 shrink-0 text-secondary" /> {claim.address}
                           </div>
                        </TableCell>
                        <TableCell className="py-5 text-center">
                           <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-xl"
                                onClick={() => setClaimToDelete(claim)}
                                disabled={processing === claim.id}
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
              <div className="py-32 text-center opacity-40">
                 <ArrowDownWideNarrow className="w-16 h-16 mx-auto mb-4" />
                 <p className="text-xl font-bold">لا توجد طلبات حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!claimToDelete} onOpenChange={(open) => !open && setClaimToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black text-primary text-center">حذف طلب الرصد؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  سيتم نقل بيانات الطالب <span className="text-primary font-bold">"{claimToDelete?.nameAr}"</span> لسلة المهملات. سيتمكن الطالب من إدخال بياناته من جديد.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction onClick={handleDelete} className="h-12 rounded-2xl bg-primary text-white font-black flex-1 hover:bg-primary/90 shadow-lg shadow-primary/10">تأكيد الحذف</AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">إلغاء</AlertDialogCancel>
            </AccordionFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
