
"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Award, 
  Search, 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle, 
  X,
  ExternalLink,
  Copy,
  Calendar,
  User,
  QrCode,
  Trophy,
  Star
} from "lucide-react";
import Link from "next/link";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
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
import { cn } from "@/lib/utils";

export default function CertificatesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [certToDelete, setCertToDelete] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const certsQuery = useMemoFirebase(() => 
    db ? query(collection(db, "certificates"), orderBy("createdAt", "desc")) : null
  , [db]);

  const { data: certificates, loading } = useCollection(certsQuery);

  const filteredCerts = useMemo(() => {
    if (!certificates) return [];
    const s = searchTerm.toLowerCase();
    return certificates.filter((c: any) => 
      c.certificateId?.toLowerCase().includes(s) || 
      c.studentNameAr?.toLowerCase().includes(s) || 
      c.courseTitle?.toLowerCase().includes(s)
    );
  }, [certificates, searchTerm]);

  const handleDelete = async () => {
    if (!db || !certToDelete) return;
    setIsProcessing(true);
    try {
      const trashRef = doc(collection(db, "trash"));
      await setDoc(trashRef, {
        originalId: certToDelete.id,
        originalPath: `certificates/${certToDelete.id}`,
        type: "certificate",
        title: `شهادة: ${certToDelete.studentNameAr}`,
        data: certToDelete,
        deletedAt: serverTimestamp()
      });
      await deleteDoc(doc(db, "certificates", certToDelete.id));
      toast({ title: "تم الحذف", description: "نُقل السجل لسلة المهملات." });
    } catch (error) {
      // Handled
    } finally {
      setIsProcessing(false);
      setCertToDelete(null);
    }
  };

  const getVerificationUrl = (cert: any) => {
    const base = cert.baseUrl || "https://siraj-app.vercel.app";
    return `${base}/verify-certificate?id=${cert.certificateId}`;
  };

  const copyVerificationLink = (cert: any) => {
    navigator.clipboard.writeText(getVerificationUrl(cert));
    toast({ title: "تم النسخ", description: "رابط التحقق المباشر جاهز." });
  };

  const getGradeText = (grade: string) => {
    const grades: Record<string, string> = {
      excellent: "ممتاز",
      very_good: "جيد جداً",
      good: "جيد",
      pass: "مقبول"
    };
    return grades[grade] || grade;
  };

  const downloadQRCode = async (cert: any) => {
    try {
      const QRCode = (await import('qrcode')).default;
      const url = getVerificationUrl(cert);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 1000, margin: 2, color: { dark: '#4A1F0F', light: '#FFFFFF' }, errorCorrectionLevel: 'H'
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `QR-SIRAJ-${cert.studentNameAr}-${cert.certificateId}.png`;
      link.click();
      toast({ title: "تم التصدير", description: "تحميل الباركود بنجاح." });
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل توليد الباركود." });
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 text-right">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary mb-2">توثيق الشهادات</h1>
            <p className="text-muted-foreground">أصدر شهادات الإتمام والأوسمة الرقمية الموثقة لطلابك.</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 h-12 rounded-xl gap-2 font-bold px-6 shadow-lg">
            <Link href="/admin/add-certificate">
              <PlusCircle className="w-5 h-5" /> إضافة شهادة جديدة
            </Link>
          </Button>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
            <div className="relative max-w-md">
              <Input 
                placeholder="ابحث برقم الشهادة أو اسم الطالب..." 
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
                <p className="text-muted-foreground font-bold">جاري تحميل السجلات...</p>
              </div>
            ) : filteredCerts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="text-right">
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-right font-black py-4">الطالب والنوع</TableHead>
                      <TableHead className="text-right font-black py-4">الدورة والتقدير</TableHead>
                      <TableHead className="text-center font-black py-4">رقم التوثيق</TableHead>
                      <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCerts.map((cert: any) => (
                      <TableRow key={cert.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", cert.certificateType === 'excellence' ? "bg-secondary text-white" : "bg-primary/5 text-primary")}>
                              {cert.certificateType === 'excellence' ? <Trophy className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                            </div>
                            <div className="text-right">
                               <div className="font-bold text-primary text-sm">{cert.studentNameAr}</div>
                               <Badge variant="ghost" className="p-0 h-auto text-[8px] font-black opacity-60">
                                  {cert.certificateType === 'excellence' ? "وسام تفوق" : "شهادة إتمام"}
                               </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                                <span className="text-xs font-bold text-primary line-clamp-1">{cert.courseTitle}</span>
                             </div>
                             <div className="flex items-center gap-3 text-[10px] pr-5">
                                <span className="flex items-center gap-1 font-black text-green-700">
                                   <Star className="w-3 h-3" /> {getGradeText(cert.grade)}
                                </span>
                                <span className="text-muted-foreground font-bold flex items-center gap-1">
                                   <Calendar className="w-3 h-3" /> {cert.issueDate}
                                </span>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                           <code className="bg-muted px-3 py-1 rounded-lg text-[10px] font-black text-secondary">{cert.certificateId}</code>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-secondary/10 text-secondary" onClick={() => downloadQRCode(cert)} title="تحميل الباركود"><QrCode className="w-4.5 h-4.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/5 text-primary" onClick={() => copyVerificationLink(cert)} title="نسخ رابط التحقق"><Copy className="w-4.5 h-4.5" /></Button>
                            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/5 text-primary"><Link href={`/admin/add-certificate?id=${cert.id}`}><Edit2 className="w-4.5 h-4.5" /></Link></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/5" onClick={() => setCertToDelete(cert)}><Trash2 className="w-4.5 h-4.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-32 text-center">
                 <Award className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
                 <h3 className="text-xl font-bold text-primary">لا توجد شهادات صادرة</h3>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!certToDelete} onOpenChange={(open) => !open && setCertToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">حذف التوثيق؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  سيتم إلغاء توثيق الشهادة رقم <span className="text-primary font-bold">"{certToDelete?.certificateId}"</span> ونقلها للسلة.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction onClick={handleDelete} disabled={isProcessing} className="h-12 rounded-2xl bg-primary text-white font-black flex-1 hover:bg-primary/90">تأكيد الحذف</AlertDialogAction>
              <AlertDialogCancel className="h-12 rounded-2xl border-primary/10 font-black flex-1 mt-0">إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
