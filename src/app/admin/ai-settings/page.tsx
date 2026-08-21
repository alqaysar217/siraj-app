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
import { 
  Bot, 
  Save, 
  Loader2, 
  Zap, 
  MessageSquare,
  Info,
  RefreshCw,
  Copy,
  CheckCircle2,
  Database,
  ArrowDown
} from "lucide-react";
import { useFirestore } from "@/firebase/provider";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AiSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [generatedKnowledge, setGeneratedData] = useState("");

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

  // دالة ذكية لجلب كافة بيانات المنصة وصياغتها كمحتوى معرفي
  const generateKnowledgeFromDB = async () => {
    if (!db) return;
    setFetchingData(true);
    try {
      let fullText = "--- بيانات الدورات المتاحة حالياً ---\n";
      
      // 1. جلب الدورات
      const coursesSnap = await getDocs(collection(db, "courses"));
      coursesSnap.forEach(d => {
        const data = d.data();
        fullText += `- دورة: ${data.title} | السعر: ${data.price} ر.ي | المدرب: ${data.instructor} | الرابط: https://siraj-app.vercel.app/course/${d.id}\n`;
      });

      fullText += "\n--- بيانات الكتب المتاحة حالياً ---\n";
      // 2. جلب الكتب
      const booksSnap = await getDocs(collection(db, "books"));
      booksSnap.forEach(d => {
        const data = d.data();
        fullText += `- كتاب: ${data.title} | الكاتب: ${data.author} | السعر: ${data.price} ر.ي | الرابط: https://siraj-app.vercel.app/book/${d.id}\n`;
      });

      fullText += "\n--- قائمة المدربين المعتمدين ---\n";
      // 3. جلب المدربين
      const instructorsSnap = await getDocs(collection(db, "instructors"));
      instructorsSnap.forEach(d => {
        const data = d.data();
        fullText += `- المدرب: ${data.name} | التخصص: ${data.specialty} | الملف الشخصي: https://siraj-app.vercel.app/instructor/${d.id}\n`;
      });

      setGeneratedData(fullText);
      toast({ title: "تم توليد البيانات", description: "يمكنك الآن نسخ النص وإضافته لقاعدة المعرفة." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل جلب البيانات من Firestore." });
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
      toast({ title: "تم حفظ الإعدادات", description: "تم تحديث سلوك المساعد الذكي بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ الإعدادات." });
    } finally {
      setSaving(false);
    }
  };

  const copyToKnowledge = () => {
    if (!generatedKnowledge) return;
    setConfig({ ...config, knowledgeBase: config.knowledgeBase + "\n\n" + generatedKnowledge });
    setGeneratedData("");
    toast({ title: "تم الإلحاق", description: "تمت إضافة البيانات الجديدة إلى المربع أدناه. لا تنسَ الحفظ." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="mb-10 text-right space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/10">
                <Bot className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-black font-headline text-primary">إعدادات سراج AI</h1>
          </div>
          <p className="text-muted-foreground font-bold pr-1">تحكم في ذكاء المنصة، فعل المساعد أو عدل معرفته الخاصة.</p>
        </header>

        <div className="grid gap-8">
          {/* قسم جلب البيانات الحية */}
          <Card className="luxury-shadow border-none rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md border-2 border-secondary/20">
            <CardHeader className="bg-secondary/10 border-b p-8">
               <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                 <Database className="w-5 h-5 text-secondary" /> مزامنة بيانات المنصة
               </CardTitle>
               <CardDescription className="text-primary/70 font-bold">استخرج أحدث الدورات والكتب من قاعدة البيانات لتعليمها للمساعد.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6 text-right">
               {!generatedKnowledge ? (
                 <Button 
                   disabled={fetchingData} 
                   onClick={generateKnowledgeFromDB}
                   className="w-full h-14 rounded-2xl bg-secondary text-white font-black gap-2"
                 >
                   {fetchingData ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                   جلب وتوليد بيانات الدورات والكتب والمدربين
                 </Button>
               ) : (
                 <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                       {generatedKnowledge}
                    </div>
                    <div className="flex gap-3">
                       <Button onClick={copyToKnowledge} className="flex-1 h-12 rounded-xl bg-green-600 text-white font-black gap-2">
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
                 <Zap className="w-5 h-5 text-secondary" /> التحكم في الميزة
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[1.5rem] border border-primary/5">
                  <div className="text-right space-y-1">
                     <p className="font-black text-primary">ظهور أيقونة المساعد</p>
                     <p className="text-[10px] text-muted-foreground font-bold">عند التفعيل، ستظهر الأيقونة العائمة لجميع الطلاب في الأسفل.</p>
                  </div>
                  <Switch checked={config.visible} onCheckedChange={(val) => setConfig({...config, visible: val})} />
               </div>

               <div className="flex items-center justify-between p-6 bg-secondary/5 rounded-[1.5rem] border border-secondary/5">
                  <div className="text-right space-y-1">
                     <p className="font-black text-primary">تفعيل الدردشة والرد</p>
                     <p className="text-[10px] text-muted-foreground font-bold">عند التعطيل، ستظهر رسالة "سأتوفر قريباً" ولن يتم معالجة الرسائل.</p>
                  </div>
                  <Switch checked={config.enabled} onCheckedChange={(val) => setConfig({...config, enabled: val})} />
               </div>
            </CardContent>
          </Card>

          <Card className="luxury-shadow border-none rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b p-8">
               <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-secondary" /> تخصيص المساعد
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="space-y-3 text-right">
                  <Label className="font-black text-primary mr-1">رسالة الترحيب الأولى</Label>
                  <Input 
                    value={config.welcomeMessage} 
                    onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                    className="h-12 rounded-xl border-primary/10 bg-background font-bold text-sm text-right" 
                  />
               </div>

               <div className="space-y-3 text-right">
                  <div className="flex items-center justify-between">
                    <Label className="font-black text-primary mr-1">قاعدة المعرفة الكاملة (التي سيعتمد عليها الرد)</Label>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black">هام جداً</Badge>
                  </div>
                  <Textarea 
                    placeholder="ضع هنا كل المعلومات عن المنصة، الدورات، الأسعار، وقائمة البيانات التي ولدتها أعلاه..."
                    className="min-h-[350px] rounded-[1.5rem] border-primary/10 bg-background p-5 text-sm leading-relaxed text-right"
                    value={config.knowledgeBase}
                    onChange={(e) => setConfig({...config, knowledgeBase: e.target.value})}
                  />
                  <div className="flex items-start gap-2 bg-amber-50 p-4 rounded-xl border border-amber-100 mt-2">
                     <div className="p-1 bg-amber-600 rounded-md text-white"><Info className="w-4 h-4 shrink-0" /></div>
                     <p className="text-[10px] text-amber-800 font-bold leading-relaxed">هذا هو "عقل" المساعد. أي معلومة تضعها هنا سيعتبرها حقيقة وسيجيب بناءً عليها فوراً دون تأخير.</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <Button 
            disabled={saving} 
            onClick={handleSave} 
            className="h-16 rounded-[1.5rem] bg-primary text-white font-black text-xl shadow-xl shadow-primary/10 transition-transform active:scale-95"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 ml-2" />}
            حفظ إعدادات المساعد الذكي
          </Button>
        </div>
      </div>
    </div>
  );
}
