
'use client';

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Save, 
  Camera, 
  Loader2, 
  Eye, 
  EyeOff,
  Settings2,
  Phone
} from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase/provider";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter, FirestorePermissionError } from "@/firebase";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setPhotoData(profile.photoURL || "");
      setShowInLeaderboard(profile.showInLeaderboard !== false);
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        toast({ variant: "destructive", title: "حجم كبير", description: "يرجى اختيار صورة أقل من 800 كيلوبايت." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!db || !user) return;
    setUpdating(true);

    const userRef = doc(db, "users", user.uid);
    const updates = {
      name,
      phone,
      photoURL: photoData,
      showInLeaderboard
    };

    updateDoc(userRef, updates)
      .then(() => {
        toast({ title: "تم التحديث", description: "تم حفظ بيانات ملفك الشخصي بنجاح." });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: userRef.path, 
          operation: 'update', 
          requestResourceData: updates 
        }));
      })
      .finally(() => setUpdating(false));
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary opacity-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="mb-10 flex flex-col md:flex-row items-center gap-8 text-right bg-card/50 p-8 rounded-[2.5rem] luxury-shadow border border-primary/5">
          <div className="relative group shrink-0">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-2xl relative z-10">
              <AvatarImage src={photoData || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-primary text-white font-headline">
                {profile?.name?.charAt(0) || "س"}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-secondary text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all z-20 border-2 border-white"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          
          <div className="flex-1 text-center md:text-right space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black font-headline text-primary">{profile?.name || "طالب سراج"}</h1>
              <Badge className="bg-secondary/10 text-secondary border-none px-4 py-1 rounded-full font-bold">
                {profile?.role === 'admin' ? "مدير النظام" : "طالب علم"}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 font-medium">
              <Mail className="w-4 h-4 text-secondary" /> {profile?.email}
            </p>
          </div>
        </header>

        <Card className="luxury-shadow border-none rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-8">
            <CardTitle className="text-2xl font-black text-primary font-headline">بياناتي الشخصية</CardTitle>
            <CardDescription className="font-bold">قم بتحديث معلوماتك الشخصية وإعدادات الخصوصية الخاصة بك.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="font-bold text-primary mr-1">الاسم الكامل</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl border-primary/10 bg-background" />
              </div>
              <div className="space-y-3">
                <Label htmlFor="phone" className="font-bold text-primary mr-1">رقم التواصل (واتساب)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 rounded-2xl border-primary/10 bg-background" />
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[1.5rem] border border-primary/5">
              <div className="space-y-1 text-right">
                <p className="font-black text-primary">الظهور في لوحة المتصدرين</p>
                <p className="text-[10px] text-muted-foreground font-medium">عند التفعيل، سيظهر اسمك ونقاطك في القائمة الشرفية للطلاب.</p>
              </div>
              <Switch checked={showInLeaderboard} onCheckedChange={setShowInLeaderboard} />
            </div>

            <Button onClick={handleSaveProfile} disabled={updating} className="bg-primary text-white gap-3 w-full h-14 rounded-2xl font-black text-xl shadow-xl shadow-primary/10">
              {updating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              حفظ كافة التعديلات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
