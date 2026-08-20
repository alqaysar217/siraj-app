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
  Eye, 
  EyeOff, 
  Zap, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  Info
} from "lucide-react";
import { useFirestore } from "@/firebase/provider";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function AiSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
               <div className="space-y-3">
                  <Label className="font-black text-primary mr-1">رسالة الترحيب الأولى</Label>
                  <Input 
                    value={config.welcomeMessage} 
                    onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                    className="h-12 rounded-xl border-primary/10 bg-background font-bold text-sm" 
                  />
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-black text-primary mr-1">قاعدة المعرفة الخاصة (Knowledge Base)</Label>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black">هام جداً</Badge>
                  </div>
                  <Textarea 
                    placeholder="اكتب هنا أي تفاصيل حالية عن الدورات، الخصومات، أو تنبيهات تريد من المساعد معرفتها والرد بناءً عليها..."
                    className="min-h-[250px] rounded-[1.5rem] border-primary/10 bg-background p-5 text-sm leading-relaxed"
                    value={config.knowledgeBase}
                    onChange={(e) => setConfig({...config, knowledgeBase: e.target.value})}
                  />
                  <div className="flex items-start gap-2 bg-amber-50 p-4 rounded-xl border border-amber-100 mt-2">
                     <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                     <p className="text-[10px] text-amber-800 font-bold leading-relaxed">هذا المربع هو "عقل" المساعد. أي معلومة تكتبها هنا سيعتبرها المساعد حقيقة وسيجيب الطلاب بناءً عليها.</p>
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
