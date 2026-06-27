
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useFirestore } from "@/firebase/provider";
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Edit2, 
  FolderOpen, 
  ListOrdered, 
  FileText,
  X,
  LayoutList,
  Save,
  PlusCircle,
  AlertTriangle
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

function BookContentForm() {
  const db = useFirestore();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id");
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<any>(null);

  const chaptersQuery = useMemoFirebase(() => 
    (db && bookId) ? query(collection(db, "books", bookId, "chapters"), orderBy("order", "asc")) : null
  , [db, bookId]);
  
  const { data: chapters, loading: chaptersLoading } = useCollection(chaptersQuery);

  const [formData, setFormData] = useState({
    title: "",
    order: "1",
    lessons: [] as string[]
  });

  const [newLesson, setNewLesson] = useState("");

  const handleAddLesson = () => {
    if (!newLesson.trim()) return;
    setFormData({ ...formData, lessons: [...formData.lessons, newLesson.trim()] });
    setNewLesson("");
  };

  const removeLesson = (idx: number) => {
    setFormData({ ...formData, lessons: formData.lessons.filter((_, i) => i !== idx) });
  };

  const openAddDialog = () => {
    setEditingChapterId(null);
    setFormData({ title: "", order: String((chapters?.length || 0) + 1), lessons: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (chapter: any) => {
    setEditingChapterId(chapter.id);
    setFormData({ title: chapter.title, order: String(chapter.order || 1), lessons: chapter.lessons || [] });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!db || !bookId || !formData.title) {
        toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال عنوان الفصل." });
        return;
    }
    setLoading(true);

    const chapterData = {
      title: formData.title,
      order: Number(formData.order) || 1,
      lessons: formData.lessons,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingChapterId) {
        await updateDoc(doc(db, "books", bookId, "chapters", editingChapterId), chapterData);
      } else {
        await addDoc(collection(db, "books", bookId, "chapters"), { ...chapterData, createdAt: serverTimestamp() });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ البيانات." });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!db || !bookId || !chapterToDelete) return;
    try {
      await deleteDoc(doc(db, "books", bookId, "chapters", chapterToDelete.id));
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف الفصل." });
    } finally {
      setChapterToDelete(null);
    }
  };

  if (!bookId) return <div className="p-20 text-center">خطأ: لم يتم اختيار كتاب.</div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl text-right">
      <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-right">
          <h1 className="text-3xl font-bold font-headline text-primary">فصول ومحتوى الكتاب</h1>
          <p className="text-muted-foreground text-sm">قم ببناء هيكل الكتاب وتقسيمه إلى فصول ومواضيع تعليمية.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-secondary hover:bg-secondary/90 text-white rounded-xl gap-2 font-bold px-6 shadow-lg h-12">
          <Plus className="w-5 h-5" /> إضافة فصل جديد
        </Button>
      </header>

      {chaptersLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-secondary" /></div>
      ) : chapters && chapters.length > 0 ? (
        <div className="space-y-4">
          {chapters.map((chapter: any) => (
            <Card key={chapter.id} className="luxury-shadow border-none hover:bg-muted/30 transition-all group">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-right">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center font-black text-primary border border-primary/10">
                    {chapter.order}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary">{chapter.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                      <LayoutList className="w-3 h-3" /> {chapter.lessons?.length || 0} موضوع تعليمي
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => openEditDialog(chapter)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5">
                    <Edit2 className="w-4.5 h-4.5 text-primary" />
                  </Button>
                  <Button onClick={() => setChapterToDelete(chapter)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/5">
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/20">
          <LayoutList className="w-20 h-20 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-muted-foreground">لم يتم إضافة فصول لهذا الكتاب بعد.</h2>
          <Button onClick={openAddDialog} variant="link" className="text-secondary font-bold mt-2">ابدأ ببناء الكتاب الآن</Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none luxury-shadow [&>button]:right-auto [&>button]:left-6 [&>button]:top-6" 
          dir="rtl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-8 bg-muted/30 border-b text-right">
            <DialogTitle className="text-2xl font-black text-primary font-headline flex items-center gap-3">
              <div className="p-2.5 bg-primary text-white rounded-xl">
                  <FolderOpen className="w-6 h-6" />
              </div>
              {editingChapterId ? "تعديل بيانات الفصل" : "إضافة فصل جديد للكتاب"}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-8 text-right">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-2">
                  <Label className="font-black text-primary text-xs mr-1 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-secondary" /> عنوان الفصل
                  </Label>
                  <Input 
                    placeholder="اكتب عنوان الفصل الرئيسي..." 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    className="h-12 rounded-xl border-primary/10 bg-background text-right" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-primary text-xs text-center block flex items-center justify-center gap-2">
                    <ListOrdered className="w-3.5 h-3.5 text-secondary" /> الترتيب
                  </Label>
                  <Input 
                    type="number" 
                    value={formData.order} 
                    onChange={(e) => setFormData({...formData, order: e.target.value})} 
                    className="h-12 rounded-xl text-center border-primary/10 bg-background font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-black text-primary text-sm mr-1 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-secondary" /> مواضيع / دروس الفصل
                </Label>
                <div className="flex gap-2">
                  <Input 
                      placeholder="أضف عنوان موضوع تعليمي..." 
                      value={newLesson} 
                      onChange={(e) => setNewLesson(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLesson())}
                      className="h-12 rounded-xl border-primary/10"
                  />
                  <Button onClick={handleAddLesson} type="button" className="h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold px-6 shrink-0">إضافة</Button>
                </div>
                
                <div className="bg-muted/30 p-5 rounded-[1.5rem] border border-dashed border-primary/10 min-h-[150px] space-y-2">
                  {formData.lessons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <LayoutList className="w-10 h-10 mb-2" />
                        <p className="text-xs font-bold">لم تضف أي مواضيع لهذا الفصل بعد.</p>
                    </div>
                  ) : (
                    formData.lessons.map((lesson, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-3 px-4 rounded-xl border border-primary/5 shadow-sm animate-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-[10px] font-black text-primary">{idx + 1}</div>
                            <span className="text-sm font-bold text-primary">{lesson}</span>
                        </div>
                        <Button onClick={() => removeLesson(idx)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg">
                            <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 border-t flex flex-row-reverse gap-3 bg-muted/10">
            <Button disabled={loading} onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white h-14 px-10 rounded-2xl font-black flex-1 text-lg shadow-xl shadow-primary/10">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 ml-2" />}
              حفظ بيانات الفصل
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-14 rounded-2xl px-8 font-bold border-primary/10 bg-white">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!chapterToDelete} onOpenChange={(open) => !open && setChapterToDelete(null)}>
        <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none luxury-shadow max-w-[400px] p-10 bg-white/95 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <AlertDialogHeader className="space-y-3 p-0">
              <AlertDialogTitle className="text-2xl font-black font-headline text-primary text-center">حذف الفصل؟</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm font-medium leading-relaxed text-center">
                أنت على وشك حذف فصل <span className="text-primary font-bold">"{chapterToDelete?.title}"</span>. سيتم حذف كافة المواضيع التابعة له أيضاً.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex flex-row gap-3 mt-8">
            <AlertDialogAction 
              onClick={confirmDelete}
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
  );
}

export default function ManageBookContentPage() {
  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-secondary" /></div>}>
        <BookContentForm />
      </Suspense>
    </div>
  );
}
