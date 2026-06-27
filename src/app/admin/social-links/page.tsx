
"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Instagram, 
  Youtube, 
  MessageCircle, 
  Twitter, 
  Mail, 
  Phone, 
  Music2, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  X,
  Globe,
  Share2,
  Facebook,
  AlertTriangle
} from "lucide-react";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", name: "انستقرام", icon: Instagram, color: "text-pink-600" },
  { id: "youtube", name: "يوتيوب", icon: Youtube, color: "text-red-600" },
  { id: "facebook", name: "فيسبوك", icon: Facebook, color: "text-blue-600" },
  { id: "tiktok", name: "تيك توك", icon: Music2, color: "text-black" },
  { id: "whatsapp", name: "واتساب", icon: MessageCircle, color: "text-green-600" },
  { id: "twitter", name: "إكس (تويتر)", icon: Twitter, color: "text-blue-400" },
  { id: "email", name: "البريد الإلكتروني", icon: Mail, color: "text-primary" },
  { id: "phone", name: "رقم الهاتف", icon: Phone, color: "text-primary" },
];

export default function ManageSocialLinksPage() {
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<any>(null);
  
  const db = useFirestore();
  const { toast } = useToast();

  const socialQuery = useMemoFirebase(() => db ? query(collection(db, "socialLinks"), orderBy("order", "asc")) : null, [db]);
  const { data: links, loading: linksLoading } = useCollection(socialQuery);

  const [formData, setFormData] = useState({
    platform: "instagram",
    label: "",
    url: "",
    order: "1"
  });

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ platform: "instagram", label: "", url: "", order: String((links?.length || 0) + 1) });
    setIsDialogOpen(true);
  };

  const openEditDialog = (link: any) => {
    setEditingId(link.id);
    setFormData({
      platform: link.platform,
      label: link.label,
      url: link.url,
      order: String(link.order || 1)
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!db || !formData.url || !formData.label) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال الرابط والاسم المستعار." });
      return;
    }

    setLoading(true);
    const linkData = {
      platform: formData.platform,
      label: formData.label,
      url: formData.url,
      order: Number(formData.order) || 1,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      const linkRef = doc(db, "socialLinks", editingId);
      updateDoc(linkRef, linkData)
        .then(() => {
          toast({ title: "تم التحديث", description: "تم تعديل الرابط بنجاح." });
          setIsDialogOpen(false);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: linkRef.path,
            operation: 'update',
            requestResourceData: linkData
          }));
        })
        .finally(() => setLoading(false));
    } else {
      const socialCollection = collection(db, "socialLinks");
      const newData = { ...linkData, createdAt: serverTimestamp() };
      addDoc(socialCollection, newData)
        .then(() => {
          toast({ title: "تمت الإضافة", description: "تم إضافة رابط جديد بنجاح." });
          setIsDialogOpen(false);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: socialCollection.path,
            operation: 'create',
            requestResourceData: newData
          }));
        })
        .finally(() => setLoading(false));
    }
  };

  const confirmDelete = async () => {
    if (!db || !linkToDelete) return;
    try {
      await deleteDoc(doc(db, "socialLinks", linkToDelete.id));
      toast({ title: "تم الحذف", description: "تم مسح الرابط نهائياً." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الرابط." });
    } finally {
      setLinkToDelete(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary">إدارة حسابات التواصل</h1>
            <p className="text-muted-foreground text-sm">تحكم في الروابط التي تظهر للطلاب في صفحات المنصة الرئيسية.</p>
          </div>
          <Button onClick={openAddDialog} className="bg-secondary hover:bg-secondary/90 h-12 rounded-xl gap-2 font-bold px-6 shadow-md">
            <Plus className="w-5 h-5" /> إضافة حساب جديد
          </Button>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardContent className="p-0">
            {linksLoading ? (
              <div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>
            ) : links && links.length > 0 ? (
              <Table className="text-right">
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-right font-black py-4">المنصة</TableHead>
                    <TableHead className="text-right font-black py-4">الاسم المعروض</TableHead>
                    <TableHead className="text-right font-black py-4">الرابط / البيانات</TableHead>
                    <TableHead className="text-center font-black py-4">الترتيب</TableHead>
                    <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link: any) => {
                    const platformInfo = PLATFORMS.find(p => p.id === link.platform);
                    const PlatformIcon = platformInfo?.icon || Globe;
                    const platformColor = platformInfo?.color || "text-primary";
                    return (
                      <TableRow key={link.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <PlatformIcon className={cn("w-5 h-5", platformColor)} />
                            <span className="font-bold text-primary">{platformInfo?.name || link.platform}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-sm font-medium">{link.label}</TableCell>
                        <TableCell className="py-4 font-mono text-xs truncate max-w-[200px]" dir="ltr">{link.url}</TableCell>
                        <TableCell className="py-4 text-center font-bold">#{link.order}</TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button onClick={() => openEditDialog(link)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5">
                              <Edit2 className="w-4 h-4 text-primary" />
                            </Button>
                            <Button onClick={() => setLinkToDelete(link)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-32 text-center">
                <Share2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-primary">لا توجد حسابات مضافة</h3>
                <Button onClick={openAddDialog} variant="link" className="text-secondary font-bold">أضف أول حساب تواصل الآن</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent 
            className="rounded-[2.5rem] [&>button]:right-auto [&>button]:left-4" 
            dir="rtl"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader className="text-right">
              <DialogTitle className="text-2xl font-headline font-bold text-primary text-right w-full">
                {editingId ? "تعديل حساب التواصل" : "إضافة حساب تواصل جديد"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-6 text-right">
              <div className="space-y-2">
                <Label className="font-bold mr-1">اختر المنصة</Label>
                <Select value={formData.platform} onValueChange={(val) => setFormData({...formData, platform: val})}>
                  <SelectTrigger dir="rtl" className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl" onPointerDownOutside={(e) => e.preventDefault()}>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <p.icon className={cn("w-4 h-4", p.color)} />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold mr-1">الاسم المستعار (مثال: حسابنا الرسمي)</Label>
                <Input placeholder="اكتب الاسم الذي سيظهر للمستخدم" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} className="h-12 rounded-xl text-right" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold mr-1">الرابط / البيانات (رابط كامل أو رقم هاتف)</Label>
                <Input dir="ltr" placeholder="https://..." value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="h-12 rounded-xl text-left" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold mr-1">ترتيب العرض</Label>
                <div className="flex items-center gap-3">
                  <Input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: e.target.value})} className="h-12 rounded-xl text-center w-24" />
                  <span className="text-[10px] text-muted-foreground font-bold">كلما قل الرقم، ظهر الرابط أولاً.</span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3 flex-row-reverse mt-4">
              <Button disabled={loading} onClick={handleSubmit} className="bg-primary text-white h-12 px-8 rounded-xl font-bold flex-1 shadow-lg shadow-primary/10">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ الحساب"}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 rounded-xl px-6 border-primary/10">إلغاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!linkToDelete} onOpenChange={(open) => !open && setLinkToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-3 p-0">
                <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">حذف الرابط؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                  أنت على وشك حذف رابط <span className="text-primary font-bold">"{linkToDelete?.label}"</span> نهائياً من المنصة.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-8">
              <AlertDialogAction 
                onClick={confirmDelete}
                className="h-12 rounded-2xl bg-primary text-white font-black flex-1 hover:bg-primary/90 shadow-lg shadow-primary/10"
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
