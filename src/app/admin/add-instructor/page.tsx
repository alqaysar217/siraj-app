
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
  User, 
  Award, 
  Image as ImageIcon, 
  Upload,
  Globe,
  Briefcase,
  Star,
  BookOpen,
  MessageCircle,
  Linkedin,
  Instagram,
  Facebook
} from "lucide-react";
import { errorEmitter, FirestorePermissionError } from "@/firebase";

function AddInstructorForm() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const instructorId = searchParams.get("id");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    accreditation: "مدرب معتمد",
    bio: "",
    photoURL: "",
    specialty: "programming",
    rating: "4.9",
    qualifications: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    whatsapp: ""
  });

  useEffect(() => {
    async function fetchInstructor() {
      if (!db || !instructorId) return;
      setInitialLoading(true);
      try {
        const docRef = doc(db, "instructors", instructorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || "",
            accreditation: data.accreditation || "مدرب معتمد",
            bio: data.bio || "",
            photoURL: data.photoURL || "",
            specialty: data.specialty || "programming",
            rating: String(data.rating || "4.9"),
            qualifications: data.qualifications || "",
            linkedin: data.socials?.linkedin || "",
            instagram: data.socials?.instagram || "",
            facebook: data.socials?.facebook || "",
            whatsapp: data.socials?.whatsapp || ""
          });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل بيانات المدرب." });
      } finally {
        setInitialLoading(false);
      }
    }
    fetchInstructor();
  }, [db, instructorId, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { 
        toast({ variant: "destructive", title: "حجم الصورة كبير", description: "يرجى اختيار صورة أقل من 800 كيلوبايت." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.name || !formData.specialty || !formData.photoURL) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال الاسم والتخصص ورفع الصورة الشخصية." });
      return;
    }

    setLoading(true);
    
    const instructorData = {
      name: formData.name,
      accreditation: formData.accreditation,
      bio: formData.bio,
      photoURL: formData.photoURL,
      specialty: formData.specialty,
      rating: Number(formData.rating) || 4.9,
      qualifications: formData.qualifications,
      socials: {
        linkedin: formData.linkedin,
        instagram: formData.instagram,
        facebook: formData.facebook,
        whatsapp: formData.whatsapp
      },
      updatedAt: serverTimestamp()
    };

    if (instructorId) {
      const instructorRef = doc(db, "instructors", instructorId);
      updateDoc(instructorRef, instructorData)
        .then(() => {
          toast({ title: "تم التحديث", description: "تم تعديل بيانات المدرب بنجاح." });
          router.push("/admin/manage-instructors");
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: instructorRef.path,
            operation: 'update',
            requestResourceData: instructorData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const instructorsCollection = collection(db, "instructors");
      const newData = { ...instructorData, createdAt: serverTimestamp() };
      addDoc(instructorsCollection, newData)
        .then(() => {
          toast({ title: "تمت الإضافة", description: "تم إضافة المدرب الجديد بنجاح." });
          router.push("/admin/manage-instructors");
        })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: instructorsCollection.path,
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
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 text-right">
          <h1 className="text-3xl font-bold font-headline text-primary">{instructorId ? "تعديل مدرب" : "إضافة مدرب جديد"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
          <div className="lg:col-span-2 space-y-8">
            <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <User className="w-5 h-5 text-secondary" /> المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="font-bold text-primary">الاسم الكامل</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl text-right" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="accreditation" className="font-bold text-primary">الاعتماد (مثلاً: خبير برمجيات)</Label>
                    <Input id="accreditation" value={formData.accreditation} onChange={(e) => setFormData({...formData, accreditation: e.target.value})} className="h-12 rounded-xl text-right" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="bio" className="font-bold text-primary">نبذة عن المدرب</Label>
                  <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[100px] rounded-xl text-right" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="qualifications" className="font-bold text-primary">المؤهلات والخبرات</Label>
                  <Textarea id="qualifications" placeholder="اذكر الشهادات أو الخبرات العملية..." value={formData.qualifications} onChange={(e) => setFormData({...formData, qualifications: e.target.value})} className="min-h-[100px] rounded-xl text-right" />
                </div>
              </CardContent>
            </Card>

            <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <Globe className="w-5 h-5 text-secondary" /> حسابات التواصل الاجتماعي
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-primary">
                    <Linkedin className="w-4 h-4 text-[#0077B5]" /> LinkedIn
                  </Label>
                  <Input placeholder="رابط الملف الشخصي" value={formData.linkedin} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} className="h-12 rounded-xl text-left" dir="ltr" />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-primary">
                    <Instagram className="w-4 h-4 text-[#E4405F]" /> Instagram
                  </Label>
                  <Input placeholder="رابط الحساب" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} className="h-12 rounded-xl text-left" dir="ltr" />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-primary">
                    <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook
                  </Label>
                  <Input placeholder="رابط الحساب" value={formData.facebook} onChange={(e) => setFormData({...formData, facebook: e.target.value})} className="h-12 rounded-xl text-left" dir="ltr" />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 font-bold text-primary">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" /> WhatsApp
                  </Label>
                  <Input placeholder="رقم الواتساب مع رمز الدولة" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="h-12 rounded-xl text-left" dir="ltr" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="luxury-shadow border-none bg-card/50 backdrop-blur-sm">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <ImageIcon className="w-5 h-5 text-secondary" /> الصورة والتخصص
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-primary">التخصص الرئيسي</Label>
                  <Select value={formData.specialty} onValueChange={(val) => setFormData({...formData, specialty: val})}>
                    <SelectTrigger dir="rtl" className="h-12 rounded-xl">
                      <SelectValue placeholder="اختر التخصص..." />
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
                <div className="space-y-3">
                  <Label className="font-bold text-primary">التقييم</Label>
                  <Input type="number" step="0.1" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} className="h-12 rounded-xl text-right" />
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
                    <span className="font-bold text-xs text-primary">رفع الصورة</span>
                  </Button>
                  
                  {formData.photoURL && (
                    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-secondary/30 shadow-lg max-w-[200px] mx-auto">
                      <img src={formData.photoURL} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button 
              disabled={loading} 
              type="submit" 
              className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-3 text-xl font-bold shadow-xl shadow-primary/10"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {instructorId ? "حفظ التعديلات" : "حفظ المدرب"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddInstructorPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-secondary" /></div>}>
      <AddInstructorForm />
    </Suspense>
  );
}
