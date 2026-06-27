
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save, 
  BookOpen, 
  FileText, 
  Library, 
  Image as ImageIcon, 
  Upload,
  BadgeDollarSign,
  User,
  Tags,
  BookMarked,
  Star,
  PlusCircle,
  X,
  Sparkles
} from "lucide-react";
import { errorEmitter, FirestorePermissionError } from "@/firebase";

function AddBookForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("id");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    category: "programming",
    pages: "200",
    price: "",
    oldPrice: "",
    imageUrl: "",
    format: "paper" as "paper" | "digital" | "both",
    rating: "4.9"
  });

  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    async function fetchBook() {
      if (!db || !bookId) return;
      setInitialLoading(true);
      try {
        const docRef = doc(db, "books", bookId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || "",
            author: data.author || "",
            description: data.description || "",
            category: data.category || "programming",
            pages: String(data.pages || "200"),
            price: String(data.price || ""),
            oldPrice: String(data.oldPrice || ""),
            imageUrl: data.imageUrl || "",
            format: (data.format as any) || "paper",
            rating: String(data.rating || "4.9")
          });
          setFeatures(data.features || []);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل بيانات الكتاب." });
      } finally {
        setInitialLoading(false);
      }
    }
    fetchBook();
  }, [db, bookId, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { 
        toast({ variant: "destructive", title: "حجم كبير", description: "الصورة يجب أن تكون أقل من 800 كيلوبايت." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures([...features, newFeature.trim()]);
    setNewFeature("");
  };

  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.title || !formData.author || !formData.price || !formData.imageUrl) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال العنوان، المؤلف، السعر، ورفع الغلاف." });
      return;
    }

    setLoading(true);
    
    const bookData = {
      title: formData.title,
      author: formData.author,
      description: formData.description,
      category: formData.category,
      pages: Number(formData.pages) || 0,
      price: Number(formData.price) || 0,
      oldPrice: Number(formData.oldPrice) || 0,
      imageUrl: formData.imageUrl,
      format: formData.format,
      rating: Number(formData.rating) || 4.9,
      features: features,
      updatedAt: serverTimestamp()
    };

    if (bookId) {
      const bookRef = doc(db, "books", bookId);
      updateDoc(bookRef, bookData)
        .then(() => {
          router.push("/admin/manage-books");
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: bookRef.path,
            operation: 'update',
            requestResourceData: bookData,
          }));
        })
        .finally(() => setLoading(false));
    } else {
      const booksCollection = collection(db, "books");
      const newData = { ...bookData, createdAt: serverTimestamp() };
      addDoc(booksCollection, newData)
        .then(() => {
          router.push("/admin/manage-books");
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: booksCollection.path,
            operation: 'create',
            requestResourceData: newData,
          }));
        })
        .finally(() => setLoading(false));
    }
  };

  if (initialLoading) {
    return <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold font-headline text-primary">{bookId ? "تعديل كتاب" : "إضافة كتاب جديد"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right" dir="rtl">
        <div className="lg:col-span-2 space-y-8">
          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <BookOpen className="w-5 h-5 text-secondary" /> بيانات الكتاب الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="title" className="font-bold text-primary flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-secondary" /> عنوان الكتاب
                  </Label>
                  <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="h-12 rounded-xl text-right" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="author" className="font-bold text-primary flex items-center gap-2">
                    <User className="w-4 h-4 text-secondary" /> اسم الكاتب / المؤلف
                  </Label>
                  <Input id="author" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="h-12 rounded-xl text-right" />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="description" className="font-bold text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary" /> نبذة عن الكتاب
                </Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-xl text-right leading-relaxed" />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="font-bold text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-secondary" /> مميزات الكتاب (اختياري)
                </Label>
                <div className="flex gap-2">
                   <Input 
                      placeholder="أضف ميزة (مثلاً: جودة الطباعة)..." 
                      value={newFeature} 
                      onChange={(e) => setNewFeature(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="h-11 rounded-xl"
                   />
                   <Button onClick={addFeature} type="button" className="h-11 rounded-xl bg-secondary text-white shrink-0">إضافة</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-primary/5 p-2 px-4 rounded-xl border border-primary/10">
                       <span className="text-xs font-bold text-primary">{feature}</span>
                       <Button onClick={() => removeFeature(idx)} variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5 text-secondary" /> المواصفات الفنية والتقييم
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="font-bold text-primary flex items-center gap-2">
                  <Library className="w-4 h-4 text-secondary" /> عدد الصفحات
                </Label>
                <Input type="number" value={formData.pages} onChange={(e) => setFormData({...formData, pages: e.target.value})} className="h-12 rounded-xl text-center" />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-primary flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" /> تقييم الكتاب
                </Label>
                <Input type="number" step="0.1" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} className="h-12 rounded-xl text-center" />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-primary flex items-center gap-2">
                  <Tags className="w-4 h-4 text-secondary" /> نوع النسخة
                </Label>
                <Select value={formData.format} onValueChange={(val: any) => setFormData({...formData, format: val})}>
                  <SelectTrigger className="h-12 rounded-xl" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="paper">نسخة ورقية فقط</SelectItem>
                    <SelectItem value="digital">نسخة رقمية (PDF)</SelectItem>
                    <SelectItem value="both">ورقي + رقمي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <BadgeDollarSign className="w-5 h-5 text-secondary" /> السعر والمجال
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="font-bold text-primary flex items-center gap-2">
                  <Tags className="w-4 h-4 text-secondary" /> المجال / القسم
                </Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="h-12 rounded-xl" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="programming">البرمجة والتطوير</SelectItem>
                    <SelectItem value="web">تطوير الويب</SelectItem>
                    <SelectItem value="games">برمجة الألعاب</SelectItem>
                    <SelectItem value="networks">الشبكات والسيرفرات</SelectItem>
                    <SelectItem value="os">نظم التشغيل</SelectItem>
                    <SelectItem value="databases">قواعد البيانات</SelectItem>
                    <SelectItem value="ai">الذكاء الاصطناعي</SelectItem>
                    <SelectItem value="cybersecurity">الأمن السيبراني</SelectItem>
                    <SelectItem value="encryption">التشفير والحماية</SelectItem>
                    <SelectItem value="design">التصميم الإبداعي</SelectItem>
                    <SelectItem value="management">الإدارة والقيادة</SelectItem>
                    <SelectItem value="accounting">المحاسبة والمالية</SelectItem>
                    <SelectItem value="economics">الاقتصاد</SelectItem>
                    <SelectItem value="analysis">تحليل البيانات</SelectItem>
                    <SelectItem value="math">الرياضيات البرمجية</SelectItem>
                    <SelectItem value="statistics">الإحصاء</SelectItem>
                    <SelectItem value="quantitative">الأساليب الكمية</SelectItem>
                    <SelectItem value="general">ثقافة عامة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary">السعر الحالي</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="h-11 rounded-xl text-center font-bold text-secondary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">السعر السابق</Label>
                  <Input type="number" value={formData.oldPrice} onChange={(e) => setFormData({...formData, oldPrice: e.target.value})} className="h-11 rounded-xl text-center text-muted-foreground line-through" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <ImageIcon className="w-5 h-5 text-secondary" /> غلاف الكتاب
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-20 border-dashed border-2 rounded-2xl flex flex-col gap-1 hover:bg-secondary/5 transition-all">
                <Upload className="w-5 h-5 text-secondary" />
                <span className="font-bold text-xs">رفع صورة الغلاف</span>
              </Button>
              {formData.imageUrl && (
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-secondary/30 shadow-lg">
                  <img src={formData.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                </div>
              )}
            </CardContent>
          </Card>

          <Button disabled={loading} type="submit" className="w-full h-14 bg-primary text-white rounded-2xl gap-3 text-xl font-bold shadow-xl shadow-primary/10">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {bookId ? "حفظ التعديلات" : "حفظ الكتاب"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AddBookPage() {
  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>}>
        <AddBookForm />
      </Suspense>
    </div>
  );
}
