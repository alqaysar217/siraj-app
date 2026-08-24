'use client';

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Bot, 
  Save, 
  Loader2, 
  Zap, 
  MessageSquare,
  Info,
  RefreshCw,
  Database,
  ArrowDown,
  LayoutGrid,
  Trophy,
  Share2,
  BookOpen,
  CreditCard
} from "lucide-react";
import { useFirestore } from "@/firebase/provider";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AiSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [generatedKnowledge, setGeneratedData] = useState("");

  const [selectedTypes, setSelectedTypes] = useState({
    courses: true,
    books: false,
    instructors: false,
    leaderboard: false,
    socials: false,
    banks: false
  });

  const [config, setConfig] = useState({
    enabled: true,
    visible: true,
    welcomeMessage: "مرحباً بك في منصة سراج! أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟",
    knowledgeBase: ""
  });

  useEffect(() => {
    async function fetchConfig() {
      if (!db) return;
      try {
        const docRef = doc(db, "settings", "ai_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, [db]);

  const generateKnowledgeFromDB = async () => {
    if (!db) return;
    setFetchingData(true);
    try {
      let fullText = "";

      // 1. جلب الدورات مع المنهج
      if (selectedTypes.courses) {
        fullText += "\n--- بيانات الدورات والمنهج الدراسي ---\n";
        const coursesSnap = await getDocs(collection(db, "courses"));
        for (const d of coursesSnap.docs) {
          const data = d.data();
          fullText += `- دورة: ${data.title}. | السعر: ${data.price} ر.ي | المدرب: ${data.instructor}\n`;
          fullText += `  الرابط: https://siraj-app.vercel.app/course/${d.id}\n`;
          
          const lessonsSnap = await getDocs(query(collection(db, "courses", d.id, "lessons"), orderBy("order", "asc")));
          if (!lessonsSnap.empty) {
            fullText += `  محتوى المنهج: ${lessonsSnap.docs.map(l => l.data().title).join("، ")}\n`;
          }
        }
      }

      // 2. جلب الكتب
      if (selectedTypes.books) {
        fullText += "\n--- بيانات المكتبة والكتب ---\n";
        const booksSnap = await getDocs(collection(db, "books"));
        booksSnap.forEach(d => {
          const data = d.data();
          fullText += `- كتاب: ${data.title} | الكاتب: ${data.author} | السعر: ${data.price} ر.ي\n`;
          fullText += `  الرابط: https://siraj-app.vercel.app/book/${d.id}\n`;
        });
      }

      // 3. جلب المدربين
      if (selectedTypes.instructors) {
        fullText += "\n--- قائمة المدربين المعتمدين ---\n";
        const instructorsSnap = await getDocs(collection(db, "instructors"));
        instructorsSnap.forEach(d => {
          const data = d.data();
          fullText += `- المدرب: ${data.name} | التخصص: ${data.specialty} | الملف: https://siraj-app.vercel.app/instructor/${d.id}\n`;
        });
      }

      // 4. جلب الحسابات البنكية
      if (selectedTypes.banks) {
        fullText += "\n--- الحسابات البنكية للإيداع ---\n";
        const banksSnap = await getDocs(collection(db, "bankAccounts"));
        banksSnap.forEach(d => {
          const data = d.data();
          fullText += `- بنك: ${data.bankName} | الحساب: ${data.accountNumber} | الصاحب: ${data.accountHolder}\n`;
        });
      }

      // 5. جلب المتصدرين
      if (selectedTypes.leaderboard) {
        fullText += "\n--- قائمة المتصدرين (الأبطال) ---\n";
        const usersSnap = await getDocs(query(collection(db, "users"), where("showInLeaderboard", "==", true), limit(5)));
        let rank = 1;
        usersSnap.forEach(d => {
          const data = d.data();
          fullText += `#${rank} الطالب: ${data.name} | النقاط: ${data.points || 0}\n`;
          rank++;
        });
      }

      setGeneratedData(fullText);
      toast({ title: "تم توليد البيانات", description: "يمكنك الآن دمج النص في قاعدة المعرفة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل جلب البيانات." });
    } finally {
      setFetchingData(false);
    }
  };

  const handleSave = async () => {
    if (!db) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "ai_config"), {
        ...config,
        updatedAt: serverTimestamp()
      });
      toast({ title: "تم حفظ الإعدادات", description: "المساعد يعمل الآن بالمعلومات الجديدة." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحفظ." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-secondary" /></div>;

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="mb-10 text-right space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary text-white rounded-2xl shadow-xl">
                <Bot className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-black font-headline text-primary">ذكاء منصة سراج</h1>
          </div>
          <p className="text-muted-foreground font-bold">تحكم في قاعدة المعرفة والردود الذكية للمساعد.</p>
        </header>

        <div className="grid gap-8">
          <Card className="luxury-shadow border-none rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-secondary/10 border-b p-8">
               <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                 <Database className="w-5 h-5 text-secondary" /> مزامنة وتحديث المعلومات
               </CardTitle>
               <CardDescription className="text-primary/70 font-bold">اختر البيانات التي تريد سحبها من المنصة لتعليمها للمساعد.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8 text-right">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'courses', label: 'الدورات والمنهج', icon: BookOpen },
                    { id: 'books', label: 'المكتبة والكتب', icon: LayoutGrid },
                    { id: 'instructors', label: 'المدربين', icon: Bot },
                    { id: 'banks', label: 'الحسابات البنكية', icon: CreditCard },
                    { id: 'leaderboard', label: 'قائمة المتصدرين', icon: Trophy },
                    { id: 'socials', label: 'حسابات التواصل', icon: Share2 },
                  ].map((type) => (
                    <div key={type.id} className="flex items-center space-x-reverse space-x-2 bg-primary/5 p-3 rounded-xl border border-primary/5">
                      <Checkbox 
                        id={type.id} 
                        checked={(selectedTypes as any)[type.id]} 
                        onCheckedChange={(val) => setSelectedTypes({...selectedTypes, [type.id]: val})} 
                      />
                      <label htmlFor={type.id} className="text-xs font-black cursor-pointer flex items-center gap-1.5">
                        <type.icon className="w-3.5 h-3.5 text-secondary" /> {type.label}
                      </label>
                    </div>
                  ))}
               </div>

               {!generatedKnowledge ? (
                 <Button 
                   disabled={fetchingData} 
                   onClick={generateKnowledgeFromDB}
                   className="w-full h-14 rounded-2xl bg-secondary text-white font-black gap-2"
                 >
                   {fetchingData ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                   بدء استخراج البيانات المحددة
                 </Button>
               ) : (
                 <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                       {generatedKnowledge}
                    </div>
                    <div className="flex gap-3">
                       <Button onClick={() => { setConfig({...config, knowledgeBase: config.knowledgeBase + "\n" + generatedKnowledge}); setGeneratedData(""); }} className="flex-1 h-12 rounded-xl bg-green-600 text-white font-black gap-2">
                          <ArrowDown className="w-4 h-4" /> إضافة للمربع أدناه
                       </Button>
                       <Button variant="outline" onClick={() => setGeneratedData("")} className="h-12 rounded-xl border-primary/10 font-bold">إلغاء</Button>
                    </div>
                 </div>
               )}
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b p-8">
               <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-secondary" /> عقل المساعد (Knowledge Base)
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="space-y-3 text-right">
                  <Label className="font-black text-primary mr-1">قاعدة المعرفة الكاملة</Label>
                  <Textarea 
                    placeholder="هنا يتم تخزين كل ما يعرفه المساعد عن سراج..."
                    className="min-h-[400px] rounded-[1.5rem] border-primary/10 bg-background p-5 text-sm leading-relaxed text-right"
                    value={config.knowledgeBase}
                    onChange={(e) => setConfig({...config, knowledgeBase: e.target.value})}
                  />
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-2">
                     <p className="text-[10px] text-amber-800 font-bold leading-relaxed">أي معلومة يتم وضعها هنا سيتم اعتبارها حقيقة مطلقة للمساعد.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/5">
                    <span className="font-black text-xs text-primary">ظهور الأيقونة للطلاب</span>
                    <Switch checked={config.visible} onCheckedChange={(val) => setConfig({...config, visible: val})} />
                 </div>
                 <div className="flex items-center justify-between p-5 bg-secondary/5 rounded-2xl border border-secondary/5">
                    <span className="font-black text-xs text-primary">تفعيل الرد الآلي</span>
                    <Switch checked={config.enabled} onCheckedChange={(val) => setConfig({...config, enabled: val})} />
                 </div>
               </div>
            </CardContent>
          </Card>

          <Button 
            disabled={saving} 
            onClick={handleSave} 
            className="h-16 rounded-[1.5rem] bg-primary text-white font-black text-xl shadow-xl shadow-primary/10"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 ml-2" />}
            حفظ إعدادات المساعد الذكي
          </Button>
        </div>
      </div>
    </div>
  );
}
