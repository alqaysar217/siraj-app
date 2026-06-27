
"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFirestore } from "@/firebase/provider";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save, 
  BookOpen, 
  Clock, 
  Award, 
  Image as ImageIcon, 
  User, 
  BadgeDollarSign, 
  Layers,
  Upload,
  TrendingUp,
  FileText,
  Users,
  Star,
  Tag
} from "lucide-react";
import { errorEmitter, FirestorePermissionError, useCollection, useMemoFirebase } from "@/firebase";

function AddCourseForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // تثبيت مرجع جلب المدربين لمنع الحلقة اللانهائية
  const instructorsQuery = useMemoFirebase(() => db ? collection(db, "instructors") : null, [db]);
  const { data: instructorsList } = useCollection(instructorsQuery);

  const [formData, setFormData] = useState({
    title: "",
    instructorId: "",
    description: "",
    price: "",
    oldPrice: "",
    category: "programming",
    level: "beginner",
    imageUrl: "",
    isFree: false,
    videosCount: "0",
    durationHours: "0",
    hasCertificate: true,
    studentsCount: "15",
    rating: "4.9"
  });

  useEffect(() => {
    async function fetchCourse() {
      if (!db || !courseId) return;
      setInitialLoading(true);
      try {
        const docRef = doc(db, "courses", courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || "",
            instructorId: data.instructorId || "",
            description: data.description || "",
            price: String(data.price || "0"),
            oldPrice: String(data.oldPrice || ""),
            category: data.category || "programming",
            level: data.level || "beginner",
            imageUrl: data.imageUrl || "",
            isFree: data.isFree || false,
            videosCount: String(data.videosCount || "0"),
            durationHours: String(data.durationHours || "0"),
            hasCertificate: data.hasCertificate || false,
            studentsCount: String(data.studentsCount || "15"),
            rating: String(data.rating || "4.9")
          });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل بيانات الدورة." });
      } finally {
        setInitialLoading(false);
      }
    }
    fetchCourse();
  }, [db, courseId, toast]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.title || !formData.description || !formData.imageUrl || !formData.instructorId) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال العنوان، الوصف، واختيار مدرب، ورفع غلاف الدورة." });
      return;
    }

    const selectedInstructor = instructorsList?.find(ins => ins.id === formData.instructorId);

    setLoading(true);
    
    const courseData = {
      title: formData.title,
      instructor: selectedInstructor?.name || "مدرب مجهول",
      instructorId: formData.instructorId,
      instructorPhoto: selectedInstructor?.photoURL || "",
      instructorAccreditation: selectedInstructor?.accreditation || "مدرب",
      description: formData.description,
      price: Number(formData.price) || 0,
      oldPrice: Number(formData.oldPrice) || 0,
      isFree: Number(formData.price) === 0,
      category: formData.category,
      level: formData.level,
      imageUrl: formData.imageUrl,
      videosCount: Number(formData.videosCount) || 0,
      durationHours: Number(formData.durationHours) || 0,
      hasCertificate: formData.hasCertificate,
      studentsCount: Number(formData.studentsCount) || 15,
      rating: Number(formData.rating) || 4.9,
      updatedAt: serverTimestamp()
    };

    if (courseId) {
      const courseRef = doc(db, "courses", courseId);
      updateDoc(courseRef, courseData)
        .then(() => {
          toast({ title: "تم التحديث", description: "تم تعديل بيانات الدورة بنجاح." });
          router.push("/admin/manage-courses");
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: courseRef.path,
            operation: 'update',
            requestResourceData: courseData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const coursesCollection = collection(db, "courses");
      const newData = { ...courseData, createdAt: serverTimestamp() };
      addDoc(coursesCollection, newData)
        .then(() => {
          toast({ title: "تم النشر بنجاح", description: "تم إضافة الدورة التعليمية الجديدة." });
          router.push("/admin/manage-courses");
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: coursesCollection.path,
            operation: 'create',
            requestResourceData: newData,
          });
          errorEmitter.emit('permission-error', permissionError);
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
        <h1 className="text-3xl font-bold font-headline text-primary">{courseId ? "تعديل الدورة" : "إضافة دورات"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
        <div className="lg:col-span-2 space-y-8">
          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <BookOpen className="w-5 h-5 text-secondary" /> المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="flex items-center gap-2 font-bold text-primary">
                  <Layers className="w-4 h-4 text-secondary" /> عنوان الدورة
                </Label>
                <Input 
                  id="title" 
                  placeholder="عنوان الدورة التعليمية" 
                  className="h-12 rounded-xl text-right bg-background border-primary/10"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="description" className="flex items-center gap-2 font-bold text-primary">
                  <FileText className="w-4 h-4 text-secondary" /> وصف الدورة
                </Label>
                <Textarea 
                  id="description" 
                  placeholder="اكتب وصفاً مفصلاً..." 
                  className="min-h-[120px] rounded-xl text-right leading-relaxed bg-background border-primary/10"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5 text-secondary" /> إحصائيات الدورة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <Clock className="w-4 h-4 text-secondary" /> إجمالي الساعات
                </Label>
                <Input 
                  type="number" 
                  value={formData.durationHours}
                  onChange={(e) => setFormData({...formData, durationHours: e.target.value})}
                  className="h-12 rounded-xl text-right bg-background border-primary/10"
                />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <Layers className="w-4 h-4 text-secondary" /> عدد الدروس
                </Label>
                <Input 
                  type="number" 
                  value={formData.videosCount}
                  onChange={(e) => setFormData({...formData, videosCount: e.target.value})}
                  className="h-12 rounded-xl text-right bg-background border-primary/10"
                />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <Users className="w-4 h-4 text-secondary" /> عدد الطلاب البدائي
                </Label>
                <Input 
                  type="number" 
                  value={formData.studentsCount}
                  onChange={(e) => setFormData({...formData, studentsCount: e.target.value})}
                  className="h-12 rounded-xl text-right bg-background border-primary/10"
                />
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <Star className="w-4 h-4 text-secondary" /> التقييم
                </Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  className="h-12 rounded-xl text-right bg-background border-primary/10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <BadgeDollarSign className="w-5 h-5 text-secondary" /> السعر والتصنيف
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <Layers className="w-4 h-4 text-secondary" /> المجال
                </Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-background border-primary/10" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="programming">البرمجة</SelectItem>
                    <SelectItem value="web">الويب</SelectItem>
                    <SelectItem value="games">الألعاب</SelectItem>
                    <SelectItem value="networks">الشبكات</SelectItem>
                    <SelectItem value="os">نظم التشغيل</SelectItem>
                    <SelectItem value="databases">قواعد البيانات</SelectItem>
                    <SelectItem value="ai">الذكاء الاصطناعي</SelectItem>
                    <SelectItem value="cybersecurity">الأمن السيبراني</SelectItem>
                    <SelectItem value="encryption">التشفير</SelectItem>
                    <SelectItem value="design">التصميم</SelectItem>
                    <SelectItem value="management">الإدارة</SelectItem>
                    <SelectItem value="accounting">المحاسبة</SelectItem>
                    <SelectItem value="economics">الاقتصاد</SelectItem>
                    <SelectItem value="analysis">التحليل</SelectItem>
                    <SelectItem value="math">الرياضيات</SelectItem>
                    <SelectItem value="statistics">الإحصاء</SelectItem>
                    <SelectItem value="quantitative">الأساليب الكمية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-primary text-xs">
                    <BadgeDollarSign className="w-3 h-3 text-secondary" /> السعر (ر.ي)
                  </Label>
                  <Input 
                    type="number" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="جديد"
                    className="h-11 rounded-xl text-right bg-background border-primary/10"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-primary text-xs">
                    <Tag className="w-3 h-3 text-muted-foreground" /> القديم (ر.ي)
                  </Label>
                  <Input 
                    type="number" 
                    value={formData.oldPrice}
                    onChange={(e) => setFormData({...formData, oldPrice: e.target.value})}
                    placeholder="سابق"
                    className="h-11 rounded-xl text-right bg-background border-primary/10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-secondary" />
                  <Label className="font-bold text-primary">شهادة إتمام</Label>
                </div>
                <Switch 
                  checked={formData.hasCertificate} 
                  onCheckedChange={(val) => setFormData({...formData, hasCertificate: val})} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <ImageIcon className="w-5 h-5 text-secondary" /> الغلاف والمدرب
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-bold text-primary">
                  <User className="w-4 h-4 text-secondary" /> اختر المدرب
                </Label>
                <Select value={formData.instructorId} onValueChange={(val) => setFormData({...formData, instructorId: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-background border-primary/10" dir="rtl">
                    <SelectValue placeholder="اختر مدرب الدورة..." />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {instructorsList?.map((ins: any) => (
                      <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 border-dashed border-2 rounded-2xl flex flex-col gap-1 hover:bg-secondary/5 transition-all"
                >
                  <Upload className="w-5 h-5 text-secondary" />
                  <span className="font-bold text-xs text-primary">رفع الغلاف</span>
                </Button>
                
                {formData.imageUrl && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-secondary/30 shadow-lg">
                    <img src={formData.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 pt-6">
          <Button 
            disabled={loading} 
            type="submit" 
            className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-3 text-xl font-bold shadow-xl shadow-primary/10"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {courseId ? "حفظ التعديلات" : "حفظ ونشر الدورة"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AddCoursePage() {
  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>}>
        <AddCourseForm />
      </Suspense>
    </div>
  );
}
