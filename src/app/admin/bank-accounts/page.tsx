
"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Upload, 
  Image as ImageIcon,
  Building2,
  User,
  Hash,
  AlertTriangle,
  X
} from "lucide-react";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, setDoc } from "firebase/firestore";
import { useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

export default function BankAccountsPage() {
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankQuery = useMemoFirebase(() => db ? query(collection(db, "bankAccounts"), orderBy("createdAt", "desc")) : null, [db]);
  const { data: accounts, loading: accountsLoading } = useCollection(bankQuery);

  const [formData, setFormData] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    imageUrl: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        toast({ variant: "destructive", title: "حجم الصورة كبير", description: "يرجى اختيار صورة أقل من 800 كيلوبايت." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ bankName: "", accountHolder: "", accountNumber: "", imageUrl: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (account: any) => {
    setEditingId(account.id);
    setFormData({
      bankName: account.bankName,
      accountHolder: account.accountHolder,
      accountNumber: account.accountNumber,
      imageUrl: account.imageUrl || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!db) return;
    if (!formData.bankName || !formData.accountNumber || !formData.accountHolder) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال الحقول المطلوبة." });
      return;
    }

    setLoading(true);
    
    const accountData = {
      ...formData,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      const accountRef = doc(db, "bankAccounts", editingId);
      updateDoc(accountRef, accountData)
        .then(() => {
          toast({ title: "تم التحديث", description: "تم تعديل بيانات الحساب بنجاح." });
          setIsDialogOpen(false);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: accountRef.path,
            operation: 'update',
            requestResourceData: accountData
          }));
        })
        .finally(() => setLoading(false));
    } else {
      const accountsCollection = collection(db, "bankAccounts");
      const newData = { ...accountData, createdAt: serverTimestamp() };
      addDoc(accountsCollection, newData)
        .then(() => {
          toast({ title: "تمت الإضافة", description: "تم إضافة الحساب البنكي الجديد بنجاح." });
          setIsDialogOpen(false);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: accountsCollection.path,
            operation: 'create',
            requestResourceData: newData
          }));
        })
        .finally(() => setLoading(false));
    }
  };

  const confirmDelete = async () => {
    if (!db || !accountToDelete) return;
    try {
      const trashRef = doc(collection(db, "trash"));
      const trashData = {
        originalId: accountToDelete.id,
        originalPath: `bankAccounts/${accountToDelete.id}`,
        type: "bankAccount",
        title: `حساب ${accountToDelete.bankName}`,
        data: accountToDelete,
        deletedAt: serverTimestamp()
      };

      await setDoc(trashRef, trashData);
      await deleteDoc(doc(db, "bankAccounts", accountToDelete.id));
      toast({ title: "تم النقل للسلة", description: "تم نقل الحساب إلى سلة المهملات." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الحساب. تأكد من صلاحيات المسؤول." });
    } finally {
      setAccountToDelete(null);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-right">
            <h1 className="text-3xl font-bold font-headline text-primary">إدارة الحسابات البنكية</h1>
            <p className="text-muted-foreground">أضف الحسابات التي ستظهر للطلاب عند طلب تفعيل الدورات.</p>
          </div>
          <Button onClick={openAddDialog} className="bg-secondary hover:bg-secondary/90 h-12 rounded-xl gap-2 font-bold px-6 shadow-md">
            <Plus className="w-5 h-5" /> إضافة حساب جديد
          </Button>
        </header>

        <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
          <CardContent className="p-0">
            {accountsLoading ? (
              <div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>
            ) : accounts && accounts.length > 0 ? (
              <Table className="text-right">
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-right font-black py-4">البنك</TableHead>
                    <TableHead className="text-right font-black py-4">صاحب الحساب</TableHead>
                    <TableHead className="text-right font-black py-4">رقم الحساب</TableHead>
                    <TableHead className="text-center font-black py-4">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc: any) => (
                    <TableRow key={acc.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-primary/5">
                            {acc.imageUrl ? (
                              <img src={acc.imageUrl || undefined} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 opacity-20" /></div>
                            )}
                          </div>
                          <span className="font-bold text-primary">{acc.bankName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium">{acc.accountHolder}</TableCell>
                      <TableCell className="py-4 font-mono font-bold text-secondary">{acc.accountNumber}</TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button onClick={() => openEditDialog(acc)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5">
                            <Edit2 className="w-4 h-4 text-primary" />
                          </Button>
                          <Button onClick={() => setAccountToDelete(acc)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5">
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
                <CreditCard className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-primary">لا توجد حسابات بنكية مضافة</h3>
                <Button onClick={openAddDialog} variant="link" className="text-secondary font-bold">أضف حسابك الأول الآن</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="rounded-[2rem] [&>button]:right-auto [&>button]:left-4" dir="rtl">
            <DialogHeader className="text-right">
              {/* تم تعديل المحاذاة لتصبح محاذاة العنوان لليمين كما طلبت */}
              <DialogTitle className="text-2xl font-headline font-bold text-primary text-right w-full">
                {editingId ? "تعديل الحساب البنكي" : "إضافة حساب بنكي جديد"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-6 text-right">
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2 pr-1">
                  <Building2 className="w-4 h-4 text-secondary" /> اسم البنك
                </Label>
                <Input placeholder="مثال: بنك الكريمي الإسلامي" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="h-12 rounded-xl text-right" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2 pr-1">
                  <User className="w-4 h-4 text-secondary" /> اسم صاحب الحساب
                </Label>
                <Input placeholder="الاسم الكامل كما يظهر في البنك" value={formData.accountHolder} onChange={(e) => setFormData({...formData, accountHolder: e.target.value})} className="h-12 rounded-xl text-right" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2 pr-1">
                  <Hash className="w-4 h-4 text-secondary" /> رقم الحساب / الآيبان
                </Label>
                <Input dir="ltr" placeholder="0000-000000-000" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} className="h-12 rounded-xl text-left" />
              </div>
              <div className="space-y-3">
                <Label className="font-bold flex items-center gap-2 pr-1">
                  <ImageIcon className="w-4 h-4 text-secondary" /> شعار البنك (اختياري)
                </Label>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-dashed border-2 rounded-2xl flex flex-col gap-1 border-primary/10 hover:bg-primary/5 transition-all">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">رفع شعار البنك</span>
                </Button>
                {formData.imageUrl && (
                  <div className="flex justify-center mt-2">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-secondary/30 shadow-md">
                      <img src={formData.imageUrl || undefined} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="gap-3 flex-row-reverse mt-4">
              <Button disabled={loading} onClick={handleSubmit} className="bg-primary text-white h-12 px-8 rounded-xl font-bold flex-1 shadow-lg shadow-primary/10">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ الحساب البنكي"}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 rounded-xl px-6 border-primary/10">إلغاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
          <AlertDialogContent dir="rtl" className="rounded-3xl border-none luxury-shadow max-w-[400px] p-6 bg-card/95 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-secondary" />
              </div>
              <AlertDialogHeader className="space-y-2 p-0">
                <AlertDialogTitle className="text-xl font-headline text-primary font-black">حذف الحساب البنكي؟</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed">
                  سيتم نقل حساب <span className="text-primary font-bold">"{accountToDelete?.bankName}"</span> إلى سلة المهملات.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="flex flex-row gap-3 mt-6">
              <AlertDialogAction 
                onClick={confirmDelete}
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
